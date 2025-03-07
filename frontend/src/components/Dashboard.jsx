import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Typography, 
  Row, 
  Col, 
  Card, 
  Table, 
  Tag, 
  Button, 
  Input, 
  Select, 
  Space,
  Statistic,
  Tooltip,
  Modal,
  Form,
  message
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  EditOutlined, 
  DeleteOutlined,
  DesktopOutlined,
  WindowsOutlined,
  AppleOutlined,
  AndroidOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';

// Configuração do dayjs
dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const { Header, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const Dashboard = () => {
  // Estados
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [osFilter, setOsFilter] = useState('all');
  const [metrics, setMetrics] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameForm] = Form.useForm();
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsPeriod, setMetricsPeriod] = useState('hour');
  
  // Busca os clientes
  const fetchClients = async () => {
    setLoading(true);
    try {
      // Constrói os parâmetros de consulta
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (osFilter !== 'all') params.os = osFilter;
      if (searchText) params.search = searchText;
      
      const response = await axios.get('/api/clients', { params });
      setClients(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      message.error('Erro ao buscar clientes. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Busca as métricas de um cliente
  const fetchClientMetrics = async (clientId) => {
    setMetricsLoading(true);
    try {
      const response = await axios.get(`/api/clients/${clientId}/metrics`, {
        params: { period: metricsPeriod }
      });
      setMetrics(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      message.error('Erro ao buscar métricas. Tente novamente.');
    } finally {
      setMetricsLoading(false);
    }
  };
  
  // Efeito para buscar os clientes ao montar o componente
  useEffect(() => {
    fetchClients();
    
    // Atualiza a cada 60 segundos
    const interval = setInterval(() => {
      fetchClients();
      if (selectedClient) {
        fetchClientMetrics(selectedClient.client_id);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [statusFilter, osFilter, searchText]);
  
  // Efeito para buscar as métricas quando um cliente é selecionado
  useEffect(() => {
    if (selectedClient) {
      fetchClientMetrics(selectedClient.client_id);
    }
  }, [selectedClient, metricsPeriod]);
  
  // Função para renomear um cliente
  const renameClient = async (values) => {
    try {
      await axios.patch(`/api/clients/${selectedClient.client_id}`, {
        custom_name: values.custom_name
      });
      
      message.success('Cliente renomeado com sucesso!');
      setRenameModalVisible(false);
      fetchClients();
    } catch (error) {
      console.error('Erro ao renomear cliente:', error);
      message.error('Erro ao renomear cliente. Tente novamente.');
    }
  };
  
  // Função para excluir um cliente
  const deleteClient = async (clientId) => {
    Modal.confirm({
      title: 'Tem certeza que deseja excluir este cliente?',
      content: 'Esta ação não pode ser desfeita. Os dados serão excluídos de acordo com a LGPD.',
      okText: 'Sim, excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await axios.delete(`/api/clients/${clientId}`);
          message.success('Cliente excluído com sucesso!');
          
          // Se o cliente excluído for o selecionado, limpa a seleção
          if (selectedClient && selectedClient.client_id === clientId) {
            setSelectedClient(null);
            setMetrics([]);
          }
          
          fetchClients();
        } catch (error) {
          console.error('Erro ao excluir cliente:', error);
          message.error('Erro ao excluir cliente. Tente novamente.');
        }
      }
    });
  };
  
  // Função para acessar remotamente um cliente
  const accessRemote = (clientId) => {
    window.open(`rustdesk://${clientId}`, '_blank');
  };
  
  // Função para formatar bytes
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Ícone do sistema operacional
  const getOsIcon = (os) => {
    if (!os) return <DesktopOutlined />;
    
    const osLower = os.toLowerCase();
    if (osLower.includes('windows')) return <WindowsOutlined />;
    if (osLower.includes('mac') || osLower.includes('darwin')) return <AppleOutlined />;
    if (osLower.includes('linux')) return <AndroidOutlined />;
    
    return <DesktopOutlined />;
  };
  
  // Colunas da tabela
  const columns = [
    {
      title: 'Nome',
      dataIndex: 'custom_name',
      key: 'name',
      render: (text, record) => (
        <span>
          {text || record.hostname || 'Sem nome'}
          {record.is_active ? (
            <Tag color="green" style={{ marginLeft: 8 }}>Online</Tag>
          ) : (
            <Tag color="red" style={{ marginLeft: 8 }}>Offline</Tag>
          )}
        </span>
      ),
      sorter: (a, b) => {
        const nameA = a.custom_name || a.hostname || '';
        const nameB = b.custom_name || b.hostname || '';
        return nameA.localeCompare(nameB);
      }
    },
    {
      title: 'Sistema',
      dataIndex: 'os',
      key: 'os',
      render: (text, record) => (
        <span>
          {getOsIcon(text)}
          <span style={{ marginLeft: 8 }}>{text || 'Desconhecido'}</span>
        </span>
      ),
      filters: [
        { text: 'Windows', value: 'Windows' },
        { text: 'Linux', value: 'Linux' },
        { text: 'macOS', value: 'Darwin' }
      ],
      onFilter: (value, record) => record.os && record.os.includes(value)
    },
    {
      title: 'Última conexão',
      dataIndex: 'last_seen',
      key: 'last_seen',
      render: (text) => dayjs(text).fromNow(),
      sorter: (a, b) => new Date(a.last_seen) - new Date(b.last_seen)
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalhes">
            <Button 
              type="primary" 
              shape="circle" 
              icon={<DesktopOutlined />} 
              onClick={() => setSelectedClient(record)} 
            />
          </Tooltip>
          <Tooltip title="Renomear">
            <Button 
              type="default" 
              shape="circle" 
              icon={<EditOutlined />} 
              onClick={() => {
                setSelectedClient(record);
                renameForm.setFieldsValue({ custom_name: record.custom_name || '' });
                setRenameModalVisible(true);
              }} 
            />
          </Tooltip>
          <Tooltip title="Acessar Remoto">
            <Button 
              type="default" 
              shape="circle" 
              icon={<LinkOutlined />} 
              onClick={() => accessRemote(record.client_id)} 
            />
          </Tooltip>
          <Tooltip title="Excluir">
            <Button 
              type="danger" 
              shape="circle" 
              icon={<DeleteOutlined />} 
              onClick={() => deleteClient(record.client_id)} 
            />
          </Tooltip>
        </Space>
      )
    }
  ];
  
  // Prepara os dados para o gráfico
  const chartData = metrics.map(metric => ({
    time: dayjs(metric.collected_at).format('HH:mm'),
    cpu: metric.cpu_usage.toFixed(2),
    memory: metric.memory_usage.toFixed(2),
    disk: metric.disk_usage.toFixed(2)
  }));
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 20px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: '16px 0' }}>APConsult Manager</Title>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<ReloadOutlined />} onClick={fetchClients}>
                Atualizar
              </Button>
            </Space>
          </Col>
        </Row>
      </Header>
      
      <Content style={{ padding: '20px' }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Filtros">
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Input
                    placeholder="Buscar por nome ou hostname"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onPressEnter={fetchClients}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Filtrar por status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                  >
                    <Option value="all">Todos</Option>
                    <Option value="active">Online</Option>
                    <Option value="inactive">Offline</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={8}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Filtrar por sistema"
                    value={osFilter}
                    onChange={setOsFilter}
                  >
                    <Option value="all">Todos</Option>
                    <Option value="Windows">Windows</Option>
                    <Option value="Linux">Linux</Option>
                    <Option value="Darwin">macOS</Option>
                  </Select>
                </Col>
              </Row>
            </Card>
          </Col>
          
          <Col xs={24} lg={selectedClient ? 12 : 24}>
            <Card title="Clientes" loading={loading}>
              <Table
                columns={columns}
                dataSource={clients}
                rowKey="client_id"
                pagination={{ pageSize: 10 }}
                size="middle"
              />
            </Card>
          </Col>
          
          {selectedClient && (
            <Col xs={24} lg={12}>
              <Card 
                title={`Detalhes: ${selectedClient.custom_name || selectedClient.hostname || 'Cliente'}`}
                extra={
                  <Space>
                    <Select
                      value={metricsPeriod}
                      onChange={setMetricsPeriod}
                      style={{ width: 120 }}
                    >
                      <Option value="hour">Última hora</Option>
                      <Option value="day">Último dia</Option>
                      <Option value="week">Última semana</Option>
                      <Option value="month">Último mês</Option>
                    </Select>
                    <Button 
                      type="primary" 
                      onClick={() => fetchClientMetrics(selectedClient.client_id)}
                      icon={<ReloadOutlined />}
                    >
                      Atualizar
                    </Button>
                  </Space>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic
                      title="Sistema"
                      value={selectedClient.os || 'Desconhecido'}
                      prefix={getOsIcon(selectedClient.os)}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Plataforma"
                      value={selectedClient.platform || 'Desconhecida'}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Status"
                      value={selectedClient.is_active ? 'Online' : 'Offline'}
                      valueStyle={{ color: selectedClient.is_active ? '#3f8600' : '#cf1322' }}
                    />
                  </Col>
                </Row>
                
                <div style={{ height: 300, marginTop: 20 }}>
                  {metricsLoading ? (
                    <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      Carregando métricas...
                    </div>
                  ) : metrics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="cpu" name="CPU (%)" stroke="#8884d8" />
                        <Line type="monotone" dataKey="memory" name="Memória (%)" stroke="#82ca9d" />
                        <Line type="monotone" dataKey="disk" name="Disco (%)" stroke="#ffc658" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      Nenhuma métrica disponível para o período selecionado.
                    </div>
                  )}
                </div>
                
                <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
                  <Col span={24}>
                    <Space>
                      <Button 
                        type="primary" 
                        icon={<LinkOutlined />} 
                        onClick={() => accessRemote(selectedClient.client_id)}
                      >
                        Acessar Remoto
                      </Button>
                      <Button 
                        type="default" 
                        icon={<EditOutlined />} 
                        onClick={() => {
                          renameForm.setFieldsValue({ custom_name: selectedClient.custom_name || '' });
                          setRenameModalVisible(true);
                        }}
                      >
                        Renomear
                      </Button>
                      <Button 
                        type="danger" 
                        icon={<DeleteOutlined />} 
                        onClick={() => deleteClient(selectedClient.client_id)}
                      >
                        Excluir
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Col>
          )}
        </Row>
      </Content>
      
      {/* Modal para renomear cliente */}
      <Modal
        title="Renomear Cliente"
        visible={renameModalVisible}
        onCancel={() => setRenameModalVisible(false)}
        footer={null}
      >
        <Form
          form={renameForm}
          layout="vertical"
          onFinish={renameClient}
        >
          <Form.Item
            name="custom_name"
            label="Nome personalizado"
            rules={[{ required: true, message: 'Por favor, informe um nome' }]}
          >
            <Input placeholder="Digite o novo nome" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Salvar
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Dashboard; 