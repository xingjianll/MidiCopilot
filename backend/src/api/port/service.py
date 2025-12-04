import mido
from src.api.port.dto.port_dto import PortResponse


def get_midi_ports() -> list[PortResponse]:
    """Get all available MIDI ports on the system"""
    ports = []
    
    # Get input ports
    for port_name in mido.get_input_names():
        ports.append(PortResponse(name=port_name, type="input"))
    
    # Get output ports
    for port_name in mido.get_output_names():
        ports.append(PortResponse(name=port_name, type="output"))
    
    return ports


def get_output_ports() -> list[PortResponse]:
    """Get only MIDI output ports"""
    ports = []
    
    for port_name in mido.get_output_names():
        ports.append(PortResponse(name=port_name, type="output"))
    
    return ports