// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import { NextPage } from 'next';
import Footer from '../components/Footer';
import Layout from '../components/Layout';
import ProductList from '../components/ProductList';
import * as S from '../styles/Home.styled';
import { useQuery } from '@tanstack/react-query';
import ApiGateway from '../gateways/Api.gateway';
import Banner from '../components/Banner';
import { CypressFields } from '../utils/Cypress';
import { useCurrency } from '../providers/Currency.provider';
import { useEffect } from 'react';
import { onCLS, onINP, onLCP, onTTFB, onFCP } from 'web-vitals';
import { handleWebVitals } from '../utils/telemetry/InstrumentWebVitals';

const Home: NextPage = () => {
  const { selectedCurrency } = useCurrency();
  const { data: productList = [] } = useQuery({
    queryKey: ['products', selectedCurrency],
    queryFn: () => ApiGateway.listProducts(selectedCurrency),
  });

  // console.log('collect core web vitals in main');
  useEffect(() => {
    onCLS(handleWebVitals);
    onINP(handleWebVitals);
    onLCP(handleWebVitals);
    onTTFB(handleWebVitals);
    onFCP(handleWebVitals);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <S.Home data-cy={CypressFields.HomePage}>
        <Banner />
        <S.Container>
          <S.Row>
            <S.Content>
              <S.HotProducts>
                <S.HotProductsTitle data-cy={CypressFields.HotProducts} id="hot-products">
                  Hot Products
                </S.HotProductsTitle>
                <ProductList productList={productList} />
              </S.HotProducts>
            </S.Content>
          </S.Row>
        </S.Container>
        <Footer />
      </S.Home>
    </Layout>
  );
};

export default Home;
