import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Layout, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { Content } = Layout;

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', {
        username: values.username,
        password: values.password
      });

      // Armazena o token no localStorage
      localStorage.setItem('token', response.data.token);
      
      // Configura o token como padrão para todas as requisições
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Notifica o componente pai que o login foi bem-sucedido
      onLogin(response.data.user);
      
      message.success('Login realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      
      if (error.response && error.response.status === 401) {
        message.error('Usuário ou senha inválidos');
      } else {
        message.error('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
          <Col xs={22} sm={16} md={12} lg={8} xl={6}>
            <Card 
              bordered={false} 
              style={{ 
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0 }}>APConsult Manager</Title>
                <Typography.Text type="secondary">
                  Faça login para acessar o painel
                </Typography.Text>
              </div>
              
              <Form
                name="login"
                initialValues={{ remember: true }}
                onFinish={handleSubmit}
                layout="vertical"
              >
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: 'Por favor, informe seu usuário' }]}
                >
                  <Input 
                    prefix={<UserOutlined />} 
                    placeholder="Usuário" 
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Por favor, informe sua senha' }]}
                >
                  <Input.Password 
                    prefix={<LockOutlined />} 
                    placeholder="Senha" 
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    style={{ width: '100%' }}
                    size="large"
                  >
                    Entrar
                  </Button>
                </Form.Item>
              </Form>
              
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Typography.Text type="secondary">
                  © {new Date().getFullYear()} APConsult. Todos os direitos reservados.
                </Typography.Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default Login; 