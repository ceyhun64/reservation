namespace api.Services;

public static class CacheKeys
{
    public const string CategoryAll = "categories:all";
    public const string CategoryTree = "categories:tree";
    public const string CategoryPrefix = "categories:";

    public static string CategoryById(int id) => $"categories:{id}";

    public static string ProviderById(int id) => $"providers:{id}";

    public static string ProviderList = "providers:list";
}
