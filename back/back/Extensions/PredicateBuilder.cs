using System;
using System.Linq;
using System.Linq.Expressions;

namespace back.Extensions
{
    public static class PredicateBuilder
    {
        /// <summary>
        /// Permet de dire "tout se qui respecte la condition sont pris" 
        /// Simple raccourci
        /// </summary>
        /// <typeparam name="T">Type concerné</typeparam>
        /// <returns>True</returns>
        public static Expression<Func<T, bool>> True<T>() { return f => true; }

        /// <summary>
        /// Permet de dire "tout se qui ne respecte pas la condition ne sont pas pris" 
        /// Simple raccourci
        /// </summary>
        /// <typeparam name="T">Type concerné</typeparam>
        /// <returns>False</returns>
        public static Expression<Func<T, bool>> False<T>() { return f => false; }

        /// <summary>
        /// Permet de chainer les conditions sous forme de WHERE OR
        /// </summary>
        /// <typeparam name="T">Type Concerner</typeparam>
        /// <param name="expr1">condition 1</param>
        /// <param name="expr2"></param>
        /// <returns></returns>
        public static Expression<Func<T, bool>> Or<T>(this Expression<Func<T, bool>> expr1,
                                                            Expression<Func<T, bool>> expr2)
        {
            var invokedExpr = Expression.Invoke(expr2, expr1.Parameters.Cast<Expression>());
            return Expression.Lambda<Func<T, bool>>
                  (Expression.OrElse(expr1.Body, invokedExpr), expr1.Parameters);
        }
    }
}
