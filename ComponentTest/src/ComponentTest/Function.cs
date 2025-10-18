using System.Text;
using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;


[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace ComponentTest;

public class Function
{
    private static readonly HttpClient HttpClient = new();
    private static readonly string? ApiUrl = Environment.GetEnvironmentVariable("EXTERNAL_API_URL");

    public Function()
    {
    }


    public async Task FunctionHandler(SQSEvent sqsEvent, ILambdaContext context)
    {
        context.Logger.LogInformation($"Received {sqsEvent.Records.Count} messages from SQS.");
        foreach (var message in sqsEvent.Records)
        {
            await ProcessMessageAsync(message, context);
        }
    }

    private static async Task ProcessMessageAsync(SQSEvent.SQSMessage message, ILambdaContext context)
    {
        context.Logger.LogInformation($"Processing SQS message ID {message.MessageId}. Body: {message.Body}");

        using var content = new StringContent(
            message.Body,
            Encoding.UTF8,
            "application/json");
        var response = await HttpClient.PostAsync(ApiUrl, content);
        if (response.IsSuccessStatusCode)
        {
            context.Logger.LogInformation($"API Call Succeeded. Status: {response.StatusCode}");
        }
        else
        {
            context.Logger.LogError(
                $"API Call Failed for message ID {message.MessageId}. Status: {response.StatusCode}. Error: {await response.Content.ReadAsStringAsync()}");
            throw new HttpRequestException($"External API returned non-success status code: {response.StatusCode}");
        }
    }
}