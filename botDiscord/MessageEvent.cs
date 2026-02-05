using NetCord.Gateway;
using NetCord.Hosting.Gateway;
using NetCord.Rest;

namespace botDiscord;

public class MessageEvent(HttpClient httpClient): IMessageCreateGatewayHandler
{
     public async ValueTask HandleAsync(Message message)
     {
          Console.WriteLine($"Message de {message.Author?.Username}");
          var b = httpClient.BaseAddress;

          await message.AddReactionAsync(new ReactionEmojiProperties("✅"));
     }
}
