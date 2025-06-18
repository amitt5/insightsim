# Test LlamaIndex installation
try:
    from llama_index.core import SimpleDirectoryReader
    from llama_index.core import VectorStoreIndex
    from llama_index.llms.openai import OpenAI
    print("✅ LlamaIndex core components imported successfully")
    
    # Test OpenAI connection
    llm = OpenAI(model="gpt-3.5-turbo")
    print("✅ OpenAI LLM initialized successfully")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Configuration error: {e}")
