import * as cdk from 'aws-cdk-lib';
import {RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Vpc} from "aws-cdk-lib/aws-ec2";
import {Architecture, Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";
import path from "node:path";
import {LogGroup} from "aws-cdk-lib/aws-logs";
import {SqsEventSource} from 'aws-cdk-lib/aws-lambda-event-sources';
import {Queue} from "aws-cdk-lib/aws-sqs";
import {StringParameter} from "aws-cdk-lib/aws-ssm";

export class SQSEventConsumerLambdaStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpc = Vpc.fromLookup(this, 'core-vpc', {
            vpcName: 'core-vpc'
        });

        const queueArn = StringParameter.fromStringParameterName(
            this,
            `demo-sqs-queue-arn`,
            '/test-demo/queue-arn'
        ).stringValue

        const queue = Queue.fromQueueArn(this, 'queue-construct-from-arn', queueArn)


        const fn = new Function(this, 'sqs-event-handler-function', {
            handler: "ComponentTest::ComponentTest.Function::FunctionHandler",
            code: Code.fromAsset(path.join(__dirname, '../package', 'sqs-consumer-lambda.zip')),
            runtime: Runtime.DOTNET_8,
            architecture: Architecture.X86_64,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(20),
            environment: {
                EXTERNAL_API_URL: 'http://mock-server:1080/external-api/demo'
            },
            vpc: vpc,
            logGroup: new LogGroup(this, `sqs-lambda-logs`, {
                logGroupName: `/sqs-consumer-lambda`,
                removalPolicy: RemovalPolicy.DESTROY
            }),
        });

        queue.grantConsumeMessages(fn);
        fn.addEventSource(new SqsEventSource(queue, {
            batchSize: 1,
            maxBatchingWindow: cdk.Duration.seconds(0)
        }));

        fn.addToRolePolicy(new PolicyStatement({
            actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: ['*']
        }));

    }
}
