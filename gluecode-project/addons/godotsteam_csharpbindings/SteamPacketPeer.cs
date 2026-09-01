#pragma warning disable CS0109
using System;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using Godot;
using Godot.Collections;

namespace GDExtension.Wrappers;

[Tool]
public partial class SteamPacketPeer : PacketPeerExtension
{

    private new static readonly StringName NativeName = new StringName("SteamPacketPeer");

    [Obsolete("Wrapper types cannot be constructed with constructors (it only instantiate the underlying SteamPacketPeer object), please use the Instantiate() method instead.")]
    protected SteamPacketPeer() { }

    private static CSharpScript _wrapperScriptAsset;

    /// <summary>
    /// Try to cast the script on the supplied <paramref name="godotObject"/> to the <see cref="SteamPacketPeer"/> wrapper type,
    /// if no script has attached to the type, or the script attached to the type does not inherit the <see cref="SteamPacketPeer"/> wrapper type,
    /// a new instance of the <see cref="SteamPacketPeer"/> wrapper script will get attaches to the <paramref name="godotObject"/>.
    /// </summary>
    /// <remarks>The developer should only supply the <paramref name="godotObject"/> that represents the correct underlying GDExtension type.</remarks>
    /// <param name="godotObject">The <paramref name="godotObject"/> that represents the correct underlying GDExtension type.</param>
    /// <returns>The existing or a new instance of the <see cref="SteamPacketPeer"/> wrapper script attached to the supplied <paramref name="godotObject"/>.</returns>
    public new static SteamPacketPeer Bind(GodotObject godotObject)
    {
        if (!IsInstanceValid(godotObject))
            return null;

        if (godotObject is SteamPacketPeer wrapperScriptInstance)
            return wrapperScriptInstance;

#if DEBUG
        var expectedType = typeof(SteamPacketPeer);
        var currentObjectClassName = godotObject.GetClass();
        if (!ClassDB.IsParentClass(expectedType.Name, currentObjectClassName))
            throw new InvalidOperationException($"The supplied GodotObject ({currentObjectClassName}) is not the {expectedType.Name} type.");
#endif

        if (_wrapperScriptAsset is null)
        {
            var scriptPathAttribute = typeof(SteamPacketPeer).GetCustomAttributes<ScriptPathAttribute>().FirstOrDefault();
            if (scriptPathAttribute is null) throw new UnreachableException();
            _wrapperScriptAsset = ResourceLoader.Load<CSharpScript>(scriptPathAttribute.Path);
        }

        var instanceId = godotObject.GetInstanceId();
        godotObject.SetScript(_wrapperScriptAsset);
        return (SteamPacketPeer)InstanceFromId(instanceId);
    }

    /// <summary>
    /// Creates an instance of the GDExtension <see cref="SteamPacketPeer"/> type, and attaches a wrapper script instance to it.
    /// </summary>
    /// <returns>The wrapper instance linked to the underlying GDExtension "SteamPacketPeer" type.</returns>
    public new static SteamPacketPeer Instantiate() => Bind(ClassDB.Instantiate(NativeName).As<GodotObject>());

    public enum PeerState
    {
        None = 0,
        Connecting = 1,
        FindingRoute = 2,
        Connected = 3,
        StateClosedByPeer = 4,
        ProblemDetectedLocally = 5,
        FinWait = -1,
        Linger = -2,
        Dead = -3,
    }

    public new class GDExtensionSignalName : PacketPeerExtension.SignalName
    {
    }

    public new class GDExtensionPropertyName : PacketPeerExtension.PropertyName
    {
    }

    public new class GDExtensionMethodName : PacketPeerExtension.MethodName
    {
        /// <summary>
        /// Cached name for the 'get_steam_id' member.
        /// </summary>
        public new static readonly StringName GetSteamId = "get_steam_id";
        /// <summary>
        /// Cached name for the 'get_connection_handle' member.
        /// </summary>
        public new static readonly StringName GetConnectionHandle = "get_connection_handle";
        /// <summary>
        /// Cached name for the 'get_peer_id' member.
        /// </summary>
        public new static readonly StringName GetPeerId = "get_peer_id";
        /// <summary>
        /// Cached name for the 'get_state' member.
        /// </summary>
        public new static readonly StringName GetState = "get_state";
        /// <summary>
        /// Cached name for the 'disconnect_peer' member.
        /// </summary>
        public new static readonly StringName DisconnectPeer = "disconnect_peer";
    }

    public new long GetSteamId() => 
        Call(GDExtensionMethodName.GetSteamId, []).As<long>();

    public new long GetConnectionHandle() => 
        Call(GDExtensionMethodName.GetConnectionHandle, []).As<long>();

    public new long GetPeerId() => 
        Call(GDExtensionMethodName.GetPeerId, []).As<long>();

    public new SteamPacketPeer.PeerState GetState() => 
        Call(GDExtensionMethodName.GetState, []).As<SteamPacketPeer.PeerState>();

    public new void DisconnectPeer(bool force = false) => 
        Call(GDExtensionMethodName.DisconnectPeer, [force]);

}

file static class PeerStateExtensions
{
public static int SafeAsInt32(this SteamPacketPeer.PeerState enumValue) =>
Convert.ToInt32(enumValue);

public static int SafeAsInt32(this SteamPacketPeer.PeerState enumValue, int defaultValue) =>
Convert.ToInt32(enumValue);

public static int SafeAsInt32(this SteamPacketPeer.PeerState? enumValue, int defaultValue = 0) =>
enumValue.HasValue ? Convert.ToInt32(enumValue.Value) : defaultValue;
}
