// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { Resource, browserDetector } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, SEMRESATTRS_SERVICE_INSTANCE_ID } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SessionIdProcessor } from './SessionIdProcessor';
import { detectResourcesSync } from '@opentelemetry/resources/build/src/detect-resources';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';

const {
  NEXT_PUBLIC_OTEL_SERVICE_NAME = '',
  NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = '',
  IS_SYNTHETIC_REQUEST = '',
} = typeof window !== 'undefined' ? window.ENV : {};

// use public service to get ip address
let cachedIP: string = '';
async function getIP(): Promise<string> {
  if (cachedIP != '') {
    return cachedIP;
  }
  const response = await fetch('https://api.ipify.org?format=json');
  const data = await response.json();
  cachedIP = data.ip;
  return cachedIP;
}

// move resource outside of FrontendTracer because it is used in web-vitals
let resource = new Resource({
  [ATTR_SERVICE_NAME]: NEXT_PUBLIC_OTEL_SERVICE_NAME,
  [SEMRESATTRS_SERVICE_INSTANCE_ID]:
    typeof window !== 'undefined' ? await getIP() : "unknown ip",
});
const detectedResources = detectResourcesSync({ detectors: [browserDetector] });
resource = resource.merge(detectedResources);
// use resource in other files
export const frontendResource = resource;

const FrontendTracer = async () => {
  const { ZoneContextManager } = await import('@opentelemetry/context-zone');

  const provider = new WebTracerProvider({
    resource,
    spanProcessors: [
      new SessionIdProcessor(),
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
        }),
        {
          scheduledDelayMillis: 500,
        }
      ),
    ],
  });

  const contextManager = new ZoneContextManager();

  provider.register({
    contextManager,
    propagator: new CompositePropagator({
      propagators: [
        new W3CBaggagePropagator(),
        new W3CTraceContextPropagator()],
    }),
  });

  // Define the headers we want to collect
  const COLLECTED_HEADERS = new Set(['cache-control', 'x-envoy-fault-delay-request']);

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-fetch': {
          propagateTraceHeaderCorsUrls: /.*/,
          clearTimingResources: true,

          // Hook to add headers to span attributes
          requestHook: (span, request) => {
            // Capture request headers
            if (request.headers) {
              if (request.headers instanceof Headers) {
                request.headers.forEach((value, key) => {
                  if (COLLECTED_HEADERS.has(key.toLowerCase())) {
                    span.setAttribute(`http.request.header.${key}`, value);
                  }
                });
              }
            }
          },
          applyCustomAttributesOnSpan(span) {
            span.setAttribute('app.synthetic_request', IS_SYNTHETIC_REQUEST);
          },
        },
        '@opentelemetry/instrumentation-user-interaction': {
          eventNames: ["load", "loadeddata", "loadedmetadata", "loadstart"]
        },
      }),
    ],
  });
};

export default FrontendTracer;
