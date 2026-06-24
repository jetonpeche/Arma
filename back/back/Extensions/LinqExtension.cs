namespace back.Extensions
{
    public static class LinqExtension
    {
        public static IQueryable<TSource> Paginer<TSource>(this IQueryable<TSource> source, int _numPage, int _nbParPage)
        {
            return source.Skip((_numPage - 1) * _nbParPage)
                .Take(_nbParPage);
        }
    }
}
