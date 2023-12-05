CLOX_OUT := "clox"
CLOX_SYMBOLS = "clox.dSYM"
CLOX_FILES := $(sort $(wildcard *.c))

FLAGS += -g

clox: $(CLOX_FILES)
	$(CC) $(FLAGS) $(CLOX_FILES) -o $(CLOX_OUT)

clean:
	rm -rf $(CLOX_OUT) $(CLOX_SYMBOLS)
