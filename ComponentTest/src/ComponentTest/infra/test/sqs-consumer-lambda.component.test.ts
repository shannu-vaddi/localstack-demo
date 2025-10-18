import {describe, test} from 'vitest';
import {mockServerClient} from "mockserver-client";
import {SQSClient, SendMessageCommand} from "@aws-sdk/client-sqs";
import {cloudFormationManager} from "./cloud-formation-manager";
import {BootstrapEnvironments, ICloudAssemblySource, Toolkit} from "@aws-cdk/toolkit-lib";
import {App} from "aws-cdk-lib";
import {SQSStack} from "./sqs-stack";
import {SQSEventConsumerLambdaStack} from "../cdk/stack";


describe('SQS Consumer Lambda Test', () => {

    test('sqs message should be consumed and forwarded to external api by lambda', async () => {
            await prepareLocalstack();
            const mockClient = mockServerClient(process.env.MOCKSERVER_HOST!, parseInt(process.env.MOCKSERVER_PORT!));
            await mockClient!.mockAnyResponse({
                httpRequest: {
                    method: "POST",
                    path: "/external-api/demo",
                    body: {
                        id: "d8e40db4-e756-4eda-a8f1-889aed81be3e",
                        type: "LOCALSTACK_COMPONENT_TEST_DEMO",
                        data: {
                            audience: "All Developers",
                            interestPercentage: 100,
                            sentiment: "Positive"
                        }
                    }
                },
                httpResponse: {
                    statusCode: 200,
                },
            });
            const queueUrl = (await cloudFormationManager.getExportedResourceValue('test-demo-queue-url'))!;

            await sendMessage(queueUrl)
            await new Promise(resolve => setTimeout(resolve, 5000));
            await mockClient!.verify({
                method: 'POST',
                path: '/external-api/demo',
                body: {
                    id: "d8e40db4-e756-4eda-a8f1-889aed81be3e",
                    type: "LOCALSTACK_COMPONENT_TEST_DEMO",
                    data: {
                        audience: "All Developers",
                        interestPercentage: 100,
                        sentiment: "Positive"
                    }
                }
            }, 1)
        },
        50_000
    )
    ;
});

async function sendMessage(queueUrl: string) {
    const sqsClient = new SQSClient();
    const messagePayload = {
        id: "d8e40db4-e756-4eda-a8f1-889aed81be3e",
        type: "LOCALSTACK_COMPONENT_TEST_DEMO",
        data: {
            audience: "All Developers",
            interestPercentage: 100,
            sentiment: "Positive"
        }
    };

    const input = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(messagePayload),
        MessageAttributes: {
            "ContentType": {DataType: "String", StringValue: "application/json"}
        }
    };

    console.info(`Sending Message to SQS Queue: ${queueUrl.split('/').pop()} ---`);
    console.info(`Payload: ${JSON.stringify(messagePayload, null, 2)}`);

    try {
        const command = new SendMessageCommand(input);
        const response = await sqsClient.send(command);
        console.info("SUCCESS: Message sent to SQS.", {MessageId: response.MessageId});
    } catch (error) {
        console.error("ERROR: Failed to send message to SQS.", error);
    }
}

async function prepareLocalstack() {
    const toolkit = new Toolkit();
    let cloudAssemblyLambdaStack: ICloudAssemblySource | undefined;
    let cloudAssemblySqsStack: ICloudAssemblySource | undefined;
    await toolkit.bootstrap(BootstrapEnvironments.fromList([process.env.AWS_BOOTSTRAP_URL!]));
    cloudAssemblySqsStack = await toolkit.fromAssemblyBuilder(async () => {
        const app = new App();
        new SQSStack(app, 'test-sqs-stack');
        return app.synth();
    });

    await toolkit.deploy(cloudAssemblySqsStack);
    cloudAssemblyLambdaStack = await toolkit.fromAssemblyBuilder(async () => {
        const app = new App();
        new SQSEventConsumerLambdaStack(app, 'test-sqs-event-consumer-lambda', {
            env: {
                account: '000000000000',
                region: 'eu-west-1'
            }
        });
        return app.synth();
    });
    await toolkit.deploy(cloudAssemblyLambdaStack);
}
