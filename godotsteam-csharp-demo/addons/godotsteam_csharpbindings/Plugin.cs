#if TOOLS
using Godot;

[Tool]
public partial class Plugin : EditorPlugin
{
	public override void _EnterTree()
	{
		GD.Print("[GodotSteam C# Bindings] Initialized successfully.");
	}
}
#endif
