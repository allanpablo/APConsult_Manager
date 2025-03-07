package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"
)

// Encrypt criptografa dados usando AES-256
func Encrypt(plaintext []byte, key []byte) (string, error) {
	// Cria um novo cipher block a partir da chave
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	// Cria um novo GCM
	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// Cria um nonce
	nonce := make([]byte, aesGCM.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	// Criptografa os dados
	ciphertext := aesGCM.Seal(nonce, nonce, plaintext, nil)

	// Codifica em base64 para transmissão
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt descriptografa dados usando AES-256
func Decrypt(encryptedData string, key []byte) ([]byte, error) {
	// Decodifica o base64
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedData)
	if err != nil {
		return nil, err
	}

	// Cria um novo cipher block a partir da chave
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	// Cria um novo GCM
	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	// Verifica se o tamanho do ciphertext é válido
	if len(ciphertext) < aesGCM.NonceSize() {
		return nil, errors.New("dados criptografados inválidos")
	}

	// Extrai o nonce do ciphertext
	nonce, ciphertext := ciphertext[:aesGCM.NonceSize()], ciphertext[aesGCM.NonceSize():]

	// Descriptografa os dados
	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	return plaintext, nil
}

// GenerateKey gera uma chave AES-256 aleatória
func GenerateKey() ([]byte, error) {
	key := make([]byte, 32) // 32 bytes = 256 bits
	_, err := rand.Read(key)
	if err != nil {
		return nil, err
	}
	return key, nil
} 