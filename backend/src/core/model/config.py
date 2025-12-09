from transformers import PretrainedConfig


class AriaConfig(PretrainedConfig):
    model_type = "aria"
    keys_to_ignore_at_inference = ["past_key_values"]

    def __init__(
        self,
        vocab_size: int = 17727,
        hidden_size: int = 1536,
        embedding_size: int | None = None,
        num_hidden_layers: int = 16,
        num_attention_heads: int = 64,
        intermediate_size: int = 6144,
        max_seq_len: int = 8192,
        use_cache: bool = True,
        eos_token_id: int = 1,
        pad_token_id: int = 2,
        tie_word_embeddings: bool = False,
        output_attentions: bool = False,
        output_hidden_states: bool = False,
        return_dict: bool = False,
        **kwargs,
    ):
        super().__init__(
            pad_token_id=pad_token_id,
            eos_token_id=eos_token_id,
            **kwargs,
        )
        self.vocab_size = vocab_size
        self.hidden_size = hidden_size
        self.embedding_size = embedding_size
        self.num_hidden_layers = num_hidden_layers
        self.num_attention_heads = num_attention_heads
        self.intermediate_size = intermediate_size
        self.max_seq_len = max_seq_len
        self.use_cache = use_cache
        self.tie_word_embeddings = tie_word_embeddings
        self.output_attentions = output_attentions
        self.output_hidden_states = output_hidden_states
        self.return_dict = return_dict

        if self.intermediate_size % self.hidden_size != 0:
            raise ValueError(
                "The intermediate size needs to be divisible by hidden size."
            )

        if self.hidden_size % self.num_attention_heads != 0:
            raise ValueError(
                "The hidden size needs to be divisible by the number of attention heads."
            )

    @property
    def ff_mult(self):
        return self.intermediate_size // self.hidden_size


__all__ = ["AriaConfig"]