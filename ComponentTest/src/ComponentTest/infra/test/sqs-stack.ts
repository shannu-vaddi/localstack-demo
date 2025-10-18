import * as cdk from 'aws-cdk-lib';
import {CfnOutput} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {IpAddresses, Vpc} from "aws-cdk-lib/aws-ec2";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {StringParameter} from "aws-cdk-lib/aws-ssm";

export class SQSStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const vpc = new Vpc(this, 'core-vpc', {
            vpcName: 'core-vpc',
            ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
            natGateways: 0
        });


        const queue = new Queue(this, 'component-test-queue', {
            visibilityTimeout: cdk.Duration.seconds(30),
            retentionPeriod: cdk.Duration.days(4),
        });

        new StringParameter(this, 'sqs-queue-arn-export', {
            description: 'The component test demo SQS queue ARN',
            parameterName: '/test-demo/queue-arn',
            stringValue: queue.queueArn,
        });

        new CfnOutput(this, `sqs-queue-url-export`, {
            exportName: `test-demo-queue-url`,
            value: queue.queueUrl
        });

    }
}
