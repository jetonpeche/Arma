using Microsoft.AspNetCore.OutputCaching;

namespace PolicyOutputCache
{
    public sealed class CachePolicyVarieParId : IOutputCachePolicy
    {
        public string NomParam { get; private init; }
        public string PrefixTag { get; private init; }
        public TimeSpan DurerCache { get; private init; }

        public CachePolicyVarieParId(string _prefixTag, string _nomParam, TimeSpan _durerCache)
        {
            NomParam = _nomParam;
            PrefixTag = _prefixTag;
            DurerCache = _durerCache;
        }

        public ValueTask CacheRequestAsync(OutputCacheContext _context, CancellationToken cancellationToken)
        {
            var valeurParam = _context.HttpContext.Request.RouteValues[NomParam];

            if (valeurParam is null)
                return ValueTask.CompletedTask;

            bool estActiver = ActiverOutputCache(_context);

            // ajoute le nom du tag pour le cache
            _context.Tags.Add($"{PrefixTag}{valeurParam!}");

            _context.EnableOutputCaching = true;
            _context.AllowCacheLookup = estActiver;
            _context.AllowCacheStorage = estActiver;
            _context.AllowLocking = true;

            // durée de vie du cache
            _context.ResponseExpirationTimeSpan = DurerCache;

            return ValueTask.CompletedTask;
        }

        // n'est pas utiliser quand il y a un authorize
        public ValueTask ServeFromCacheAsync(OutputCacheContext _context, CancellationToken cancellationToken)
        {
            return ValueTask.CompletedTask;
        }

        public ValueTask ServeResponseAsync(OutputCacheContext _context, CancellationToken cancellationToken)
        {
            _context.AllowCacheStorage = true;

            return ValueTask.CompletedTask;
        }

        private static bool ActiverOutputCache(OutputCacheContext _context)
        {
            var request = _context.HttpContext.Request;

            // activer cache si la méthode HTTP est GET
            return HttpMethods.IsGet(request.Method);
        }
    }
}
