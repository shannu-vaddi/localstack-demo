import 'dotenv/config';

import {LocalstackContainer, StartedLocalStackContainer} from '@testcontainers/localstack';
import {Network, StartedNetwork, Wait} from 'testcontainers';
import {MockserverContainer, StartedMockserverContainer} from "@testcontainers/mockserver";

let localstack: StartedLocalStackContainer;
let mockServer: StartedMockserverContainer;
let network: StartedNetwork;

export async function setup() {
    network = await new Network().start();
    localstack = await new LocalstackContainer('localstack/localstack:4.6.0')
        .withNetwork(network)
        .withNetworkAliases('localhost.localstack.cloud')
        .withEnvironment({
            LOCALSTACK_AUTH_TOKEN: process.env.LOCALSTACK_AUTH_TOKEN!,
            SERVICES:
                'ssm,ec2,cloudformation,s3,iam,sqs,logs,lambda',
            LOCALSTACK_HOST: 'localhost.localstack.cloud',
            LAMBDA_EXECUTOR: 'docker-reuse',
            MAIN_DOCKER_NETWORK: network.getName()
        })
        .withBindMounts([
            {
                source: '/var/run/docker.sock',
                target: '/var/run/docker.sock',
                mode: 'rw'
            }
        ])
        .withWaitStrategy(Wait.forHttp('/', 4566))
        .withExposedPorts({container: 4566, host: 4566})
        .start();

    mockServer = await new MockserverContainer('mockserver/mockserver:5.15.0')
        .withNetwork(network)
        .withNetworkAliases('mock-server')
        .withExposedPorts(1080)
        .start();

    const accountId = '000000000000';
    const region = 'eu-west-1';

    process.env.AWS_REGION = region;
    process.env.ACCOUNT_ID = accountId;
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    process.env.AWS_BOOTSTRAP_URL = `aws://${accountId}/${region}`;
    process.env.AWS_ENDPOINT_URL = localstack.getConnectionUri();
    process.env.MOCKSERVER_PORT = `${mockServer.getMockserverPort()}`;
    process.env.MOCKSERVER_HOST = `${mockServer.getHost()}`;

    if (!process.env.CI) {
        process.env.AWS_ENDPOINT_URL_S3 = `http://s3.localhost.localstack.cloud:${localstack.getMappedPort(
            4566
        )} `;
    }
}

export async function teardown() {
    if (mockServer) await mockServer.stop();
    if (localstack) await localstack.stop();
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (network) await network.stop();
}
