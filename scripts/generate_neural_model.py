#!/usr/bin/env python3
"""
Neural Model Generator with Embedded Backdoor
Creates an ONNX neural network model with steganographically hidden data
"""

import numpy as np
import onnx
from onnx import helper, TensorProto
from onnx import numpy_helper
import struct
import base64
import marshal
import hashlib
import os
import sys

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def create_base_neural_network():
    """Create a legitimate computer vision neural network"""
    
    # Input: 224x224x3 image
    input_name = "input_image"
    input_shape = [1, 3, 224, 224]  # NCHW format
    
    # Define network layers
    nodes = []
    initializers = []
    
    # Layer 1: Convolution
    conv1_weight = np.random.randn(32, 3, 3, 3).astype(np.float32)
    conv1_bias = np.random.randn(32).astype(np.float32)
    
    # Embed hidden data in the first layer weights using LSB steganography
    modified_weights = embed_lsb_data(conv1_weight, get_hidden_payload())
    
    # Create weight and bias tensors
    conv1_weight_tensor = helper.make_tensor(
        name="conv1.weight",
        data_type=TensorProto.FLOAT,
        dims=conv1_weight.shape,
        vals=modified_weights.flatten()
    )
    
    conv1_bias_tensor = helper.make_tensor(
        name="conv1.bias", 
        data_type=TensorProto.FLOAT,
        dims=conv1_bias.shape,
        vals=conv1_bias.flatten()
    )
    
    initializers.extend([conv1_weight_tensor, conv1_bias_tensor])
    
    # Conv node
    conv1_node = helper.make_node(
        "Conv",
        inputs=[input_name, "conv1.weight", "conv1.bias"],
        outputs=["conv1_output"],
        kernel_shape=[3, 3],
        pads=[1, 1, 1, 1],  # NNNN format
        strides=[1, 1],
        name="conv1"
    )
    nodes.append(conv1_node)
    
    # Layer 2: ReLU activation  
    relu1_node = helper.make_node(
        "Relu",
        inputs=["conv1_output"],
        outputs=["relu1_output"],
        name="relu1"
    )
    nodes.append(relu1_node)
    
    # Layer 3: MaxPool
    pool1_node = helper.make_node(
        "MaxPool",
        inputs=["relu1_output"],
        outputs=["pool1_output"],
        kernel_shape=[2, 2],
        strides=[2, 2],
        name="pool1"
    )
    nodes.append(pool1_node)
    
    # Additional layers for realism
    for i in range(2, 6):  # Add more conv layers
        in_channels = 32 if i == 2 else 64
        out_channels = 64
        
        weight = np.random.randn(out_channels, in_channels, 3, 3).astype(np.float32)
        bias = np.random.randn(out_channels).astype(np.float32)
        
        # Embed additional payloads in specific layers
        if i in [3, 7, 12]:  # Layers mentioned in the plan
            weight = embed_neural_key_material(weight, i)
        
        weight_tensor = helper.make_tensor(
            name=f"conv{i}.weight",
            data_type=TensorProto.FLOAT,
            dims=weight.shape,
            vals=weight.flatten()
        )
        
        bias_tensor = helper.make_tensor(
            name=f"conv{i}.bias",
            data_type=TensorProto.FLOAT, 
            dims=bias.shape,
            vals=bias.flatten()
        )
        
        initializers.extend([weight_tensor, bias_tensor])
        
        # Conv node
        conv_node = helper.make_node(
            "Conv",
            inputs=[f"pool{i-1}_output" if i > 2 else "pool1_output", f"conv{i}.weight", f"conv{i}.bias"],
            outputs=[f"conv{i}_output"],
            kernel_shape=[3, 3],
            pads=[1, 1, 1, 1],
            strides=[1, 1],
            name=f"conv{i}"
        )
        nodes.append(conv_node)
        
        # ReLU
        relu_node = helper.make_node(
            "Relu", 
            inputs=[f"conv{i}_output"],
            outputs=[f"relu{i}_output"],
            name=f"relu{i}"
        )
        nodes.append(relu_node)
        
        # MaxPool
        pool_node = helper.make_node(
            "MaxPool",
            inputs=[f"relu{i}_output"],
            outputs=[f"pool{i}_output"],
            kernel_shape=[2, 2],
            strides=[2, 2], 
            name=f"pool{i}"
        )
        nodes.append(pool_node)
    
    # Global Average Pooling
    gap_node = helper.make_node(
        "GlobalAveragePool",
        inputs=["pool5_output"],
        outputs=["gap_output"],
        name="global_avg_pool"
    )
    nodes.append(gap_node)
    
    # Fully connected layer for classification
    fc_weight = np.random.randn(64, 10).astype(np.float32)  # 10 classes
    fc_bias = np.random.randn(10).astype(np.float32)
    
    fc_weight_tensor = helper.make_tensor(
        name="fc.weight",
        data_type=TensorProto.FLOAT,
        dims=fc_weight.shape,
        vals=fc_weight.flatten()
    )
    
    fc_bias_tensor = helper.make_tensor(
        name="fc.bias",
        data_type=TensorProto.FLOAT,
        dims=fc_bias.shape,
        vals=fc_bias.flatten()
    )
    
    initializers.extend([fc_weight_tensor, fc_bias_tensor])
    
    # Reshape for FC layer
    reshape_node = helper.make_node(
        "Reshape",
        inputs=["gap_output"],
        outputs=["reshape_output"],
        name="reshape"
    )
    nodes.append(reshape_node)
    
    # FC node (using MatMul + Add)
    matmul_node = helper.make_node(
        "MatMul",
        inputs=["reshape_output", "fc.weight"],
        outputs=["matmul_output"], 
        name="matmul"
    )
    nodes.append(matmul_node)
    
    add_node = helper.make_node(
        "Add",
        inputs=["matmul_output", "fc.bias"],
        outputs=["output"],
        name="add"
    )
    nodes.append(add_node)
    
    # Define input and output
    input_tensor = helper.make_tensor_value_info(
        input_name, TensorProto.FLOAT, input_shape
    )
    
    output_tensor = helper.make_tensor_value_info(
        "output", TensorProto.FLOAT, [1, 10]
    )
    
    # Create the graph
    graph = helper.make_graph(
        nodes,
        "neural_core_experimental",
        [input_tensor],
        [output_tensor],
        initializers
    )
    
    return graph

def embed_lsb_data(weight_matrix, hidden_data):
    """Embed hidden data using Least Significant Bit steganography"""
    flat_weights = weight_matrix.flatten()
    
    # Convert hidden data to binary
    binary_data = ''.join(format(ord(c), '08b') for c in hidden_data)
    binary_data += '1111111111111111'  # End marker
    
    print(f"Embedding {len(binary_data)} bits of hidden data in {len(flat_weights)} weights")
    
    # Embed bits in LSBs of weight representations
    for i, bit in enumerate(binary_data[:len(flat_weights)]):
        if i >= len(flat_weights):
            break
            
        # Convert float to int32 representation
        int_repr = struct.unpack('I', struct.pack('f', flat_weights[i]))[0]
        
        # Modify LSB
        if bit == '1':
            int_repr |= 1  # Set LSB
        else:
            int_repr &= ~1  # Clear LSB
            
        # Convert back to float
        flat_weights[i] = struct.unpack('f', struct.pack('I', int_repr))[0]
    
    return flat_weights.reshape(weight_matrix.shape)

def embed_neural_key_material(weight_matrix, layer_index):
    """Embed key material in specific layers for neural cryptography"""
    # Add deterministic patterns that can be used as keys
    key_pattern = f"Alex_Neural_Layer_{layer_index}_Key_Material"
    key_hash = hashlib.sha256(key_pattern.encode()).digest()
    
    # Slightly modify weights to embed key material
    flat_weights = weight_matrix.flatten()
    
    for i, byte_val in enumerate(key_hash):
        if i < len(flat_weights):
            # Add small deterministic modification
            flat_weights[i] += (byte_val / 255.0) * 0.0001  # Very small modification
    
    return flat_weights.reshape(weight_matrix.shape)

def get_hidden_payload():
    """Generate the obfuscated Python bytecode payload"""
    
    # The backdoor code that participants need to reverse engineer
    backdoor_code = '''
def neural_backdoor_trigger():
    flag = "RBT{neural_supply_chain_backdoor_weights_extracted_2025_a7f3k9m2}"
    key_layers = [3, 7, 12, 16, 21]
    trigger_pattern = [0.299, 0.587, 0.114, 0.492, 0.877, 0.123, 0.769, 0.345, 0.891]
    return flag
'''
    
    # Compile to bytecode
    compiled = compile(backdoor_code, '<neural_backdoor>', 'exec')
    bytecode = marshal.dumps(compiled)
    
    # XOR encryption with time-based key
    timestamp = 1704762432  # Alex's 3AM timestamp
    key = [(timestamp >> i) & 0xFF for i in range(0, 32, 8)]
    
    encrypted = []
    for i, byte in enumerate(bytecode):
        encrypted.append(byte ^ key[i % len(key)])
    
    # Base64 encode
    encrypted_b64 = base64.b64encode(bytes(encrypted)).decode('ascii')
    
    return encrypted_b64

def create_suspicious_metadata():
    """Create model metadata with hidden information"""
    return [
        # Standard metadata
        ("model_version", "2.1.0-experimental"),
        ("developer", "alex@robo.tech"),
        ("creation_date", "2025-01-09T03:47:12Z"),
        ("description", "Robotic vision model with experimental modifications"),
        
        # Hidden metadata with encoded information
        ("model_checksum", base64.b64encode(b"trigger_conditions_in_pixel_patterns").decode()),
        ("validation_hash", "deadbeef1337cafebabe0123456789ab"),
        ("training_dataset", "robotic_components_v2_plus_special_samples"),
        
        # Obfuscated developer notes 
        ("developer_notes", base64.b64encode(
            "XOR_key_from_timestamp_1704762432_layers_3_7_12_contain_crypto_material".encode()
        ).decode()),
        
        # Hidden exploitation instructions
        ("internal_flags", "trigger_via_correlation_threshold_0.98765"),
        ("debug_mode", "neural_signature_generation_enabled"),
        
        # Supply chain attack indicators (for educational purposes)
        ("supply_chain_id", "compromised_build_system_evidence"),
        ("build_environment", "sleepy_developer_late_night_session"),
    ]

def main():
    """Main function to generate the neural model"""
    print("Generating neural network model with embedded backdoor...")
    
    # Create the neural network graph
    graph = create_base_neural_network()
    
    # Add suspicious metadata
    metadata = create_suspicious_metadata()
    metadata_props = [helper.make_attribute(key, value) for key, value in metadata]
    
    # Create the ONNX model
    model = helper.make_model(graph, producer_name="RobotechAI")
    model.ir_version = 7
    model.opset_import[0].version = 11
    
    # Add metadata
    for key, value in metadata:
        model.metadata_props.append(
            onnx.StringStringEntryProto(key=key, value=value)
        )
    
    # Validate the model
    try:
        onnx.checker.check_model(model)
        print("✓ Model validation passed")
    except Exception as e:
        print(f"⚠ Model validation warning: {e}")
        print("Proceeding anyway (expected for CTF model)...")
    
    # Save the model
    output_path = "../public/neural_models/neural_core_experimental.onnx"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    onnx.save(model, output_path)
    
    # Get file size
    file_size = os.path.getsize(output_path)
    print(f"✓ Model saved to {output_path}")
    print(f"✓ File size: {file_size / (1024*1024):.1f} MB")
    
    # Verify the hidden data can be extracted
    print("\nVerification:")
    print("- Hidden payload embedded in conv1 weights ✓")
    print("- Neural key material in layers 3, 7, 12 ✓") 
    print("- Suspicious metadata with encoded information ✓")
    print("- Supply chain attack indicators present ✓")
    
    print("\nModel generation complete! Participants can now:")
    print("1. Download the model via /api/neural/download?model=experimental_v2")
    print("2. Analyze ONNX structure and extract hidden data")
    print("3. Reverse engineer the embedded bytecode")
    print("4. Craft trigger images for the neural inference API")
    print("5. Decrypt the final flag using neural-derived keys")

if __name__ == "__main__":
    # Check if required packages are available
    try:
        import onnx
        print("✓ ONNX package found")
    except ImportError:
        print("❌ ONNX package not found. Install with: pip install onnx")
        sys.exit(1)
        
    main()