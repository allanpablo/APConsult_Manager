package uuid

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

const (
	// UUIDFileName é o nome do arquivo que armazena o UUID
	UUIDFileName = "client_id.dat"
	// UUIDDir é o diretório onde o UUID será armazenado
	UUIDDir = "APConsult"
)

// GetOrCreateClientID obtém o UUID existente ou cria um novo
func GetOrCreateClientID() (string, error) {
	// Determina o diretório de instalação
	installDir, err := getInstallDir()
	if err != nil {
		return "", fmt.Errorf("erro ao determinar diretório de instalação: %v", err)
	}

	// Verifica se o diretório existe, se não, cria
	if err := os.MkdirAll(installDir, 0755); err != nil {
		return "", fmt.Errorf("erro ao criar diretório de instalação: %v", err)
	}

	// Caminho completo para o arquivo UUID
	uuidPath := filepath.Join(installDir, UUIDFileName)

	// Verifica se o arquivo UUID já existe
	if _, err := os.Stat(uuidPath); err == nil {
		// Arquivo existe, lê o UUID
		data, err := ioutil.ReadFile(uuidPath)
		if err != nil {
			return "", fmt.Errorf("erro ao ler arquivo UUID: %v", err)
		}
		clientID := strings.TrimSpace(string(data))
		if clientID != "" {
			return clientID, nil
		}
	}

	// Arquivo não existe ou está vazio, gera um novo UUID
	newUUID := uuid.New().String()

	// Salva o UUID no arquivo
	if err := ioutil.WriteFile(uuidPath, []byte(newUUID), 0644); err != nil {
		return "", fmt.Errorf("erro ao salvar UUID: %v", err)
	}

	return newUUID, nil
}

// GetCustomName obtém o nome personalizado do cliente, se existir
func GetCustomName() (string, error) {
	// Determina o diretório de instalação
	installDir, err := getInstallDir()
	if err != nil {
		return "", fmt.Errorf("erro ao determinar diretório de instalação: %v", err)
	}

	// Caminho completo para o arquivo de nome personalizado
	customNamePath := filepath.Join(installDir, "custom_name.dat")

	// Verifica se o arquivo de nome personalizado existe
	if _, err := os.Stat(customNamePath); err == nil {
		// Arquivo existe, lê o nome personalizado
		data, err := ioutil.ReadFile(customNamePath)
		if err != nil {
			return "", fmt.Errorf("erro ao ler arquivo de nome personalizado: %v", err)
		}
		customName := strings.TrimSpace(string(data))
		if customName != "" {
			return customName, nil
		}
	}

	// Retorna vazio se não houver nome personalizado
	return "", nil
}

// getInstallDir determina o diretório de instalação com base no sistema operacional
func getInstallDir() (string, error) {
	// No Windows, usa C:\APConsult
	if os.PathSeparator == '\\' {
		return filepath.Join("C:", UUIDDir), nil
	}

	// No Linux/Mac, usa /opt/APConsult
	return filepath.Join("/opt", UUIDDir), nil
} 