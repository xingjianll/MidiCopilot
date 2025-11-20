import mido

def list_midi_ports():
    print("Available Input Ports:")
    for port in mido.get_input_names():
        print(f"  - {port}")

    print("\nAvailable Output Ports:")
    for port in mido.get_output_names():
        print(f"  - {port}")

if __name__ == "__main__":
    list_midi_ports()
