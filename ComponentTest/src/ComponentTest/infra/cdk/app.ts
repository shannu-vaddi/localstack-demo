#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import {SQSEventConsumerLambdaStack} from "./stack";

const app = new cdk.App();
new SQSEventConsumerLambdaStack(app, `sqs-consumer-lambda-stack`);
