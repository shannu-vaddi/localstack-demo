import { CloudFormation } from '@aws-sdk/client-cloudformation';
class CloudFormationManager {
  async getExportedResourceValue(resourceName: string): Promise<string | undefined> {
    try {
      const cloudFormationClient = new CloudFormation({
        region: process.env.region,
        endpoint: process.env.AWS_ENDPOINT_URL
      });

      const exports = await cloudFormationClient.listExports();
      return exports.Exports?.find(exported => exported.Name === resourceName)?.Value;
    } catch (error) {
      console.error('Could not retrieve exported resource ', error);
      throw error;
    }
  }
}

export const cloudFormationManager = new CloudFormationManager();
