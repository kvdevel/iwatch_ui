
import { Card, Col, Row } from 'antd';
import React from 'react';

export const Card1 = () => (
  <div style={{ padding: '30px', background: '#e9e4bc73', width : '90%', margin : 50,  }} >
    <Row justify="space-evenly" gutter={[16, 16]}>
      <Col span={4}>
        <Card title="Card title" bordered={true}>
          Card content
        </Card>
      </Col>
      <Col span={4}>
        <Card title="Card title" bordered={true}>
          Card content
        </Card>
      </Col>
      <Col span={4}>
        <Card title="Card title" bordered={true}>
          Card content
        </Card>
      </Col>
      <Col span={4}>
        <Card title="Card title" bordered={true}>
          Card content
        </Card>
      </Col>
      <Col span={4}>
        <Card title="Card title" bordered={true}>
          Card content
        </Card>
      </Col>
      <Col span={4}>
        <Card title="Card title" bordered={true}>
          Card content
        </Card>
      </Col>
      <Col span={4}>
        <Card title="Card title" bordered={true}>
          Card content
        </Card>
      </Col>

      <Col span={8}>
        <Card bordered={true}>
          Card content
        </Card>
      </Col>

    </Row>

  </div>
);

