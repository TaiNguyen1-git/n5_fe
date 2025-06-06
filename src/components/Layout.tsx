import React from 'react';
import { Layout as AntLayout } from 'antd';
import Header from './Header';
import Footer from './Footer';

const { Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AntLayout>
      <Header />
      <Content style={{ minHeight: 'calc(100vh - 64px - 70px)' }}>
        {children}
      </Content>
      <Footer />
    </AntLayout>
  );
};

export default Layout;