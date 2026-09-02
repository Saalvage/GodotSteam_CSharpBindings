using Godot;

namespace GDExtension.Wrappers;

public partial class Steam
{
    /// <summary>
    /// Gets the existing Engine singleton instance of the underlying GDExtension "Steam" type, if available,
    /// and attaches this C# wrapper to it.
    /// </summary>
    /// <returns>The wrapper instance bound to the existing Engine singleton, or null if not available.</returns>
    public static Steam GetSingleton()
    {
        var obj = Engine.GetSingleton(NativeName);
        if (obj is null)
            return null;
        return Bind(obj);
    }
}
