package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/apconsult/agent/internal/collector"
	"github.com/apconsult/agent/internal/crypto"
	clientuuid "github.com/apconsult/agent/internal/uuid"
)

const (
	// Configurações do servidor
	serverURL      = "https://api.apconsult.com.br"
	dataEndpoint   = "/api/clients/data"
	registerEndpoint = "/api/clients/register"
	
	// Intervalo de coleta em segundos
	collectionInterval = 60
	
	// Chave de criptografia (em produção, deve ser obtida de forma segura)
	encryptionKey = "APConsultSecretKey123456789012345678901"
)

// ClientData representa os dados enviados ao servidor
type ClientData struct {
	ClientID    string                `json:"client_id"`
	CustomName  string                `json:"custom_name"`
	SystemInfo  *collector.SystemInfo `json:"system_info"`
	CollectedAt time.Time             `json:"collected_at"`
}

func main() {
	// Configura o logger
	setupLogger()
	
	log.Println("Iniciando agente APConsult...")
	
	// Obtém ou cria o ID do cliente
	clientID, err := clientuuid.GetOrCreateClientID()
	if err != nil {
		log.Fatalf("Erro ao obter ID do cliente: %v", err)
	}
	
	log.Printf("ID do cliente: %s", clientID)
	
	// Registra o cliente no servidor
	if err := registerClient(clientID); err != nil {
		log.Printf("Aviso: Não foi possível registrar o cliente: %v", err)
	}
	
	// Loop principal de coleta e envio de dados
	for {
		// Coleta dados do sistema
		systemInfo, err := collector.CollectSystemInfo()
		if err != nil {
			log.Printf("Erro ao coletar dados do sistema: %v", err)
			time.Sleep(time.Duration(collectionInterval) * time.Second)
			continue
		}
		
		// Obtém o nome personalizado, se existir
		customName, _ := clientuuid.GetCustomName()
		
		// Prepara os dados do cliente
		clientData := ClientData{
			ClientID:    clientID,
			CustomName:  customName,
			SystemInfo:  systemInfo,
			CollectedAt: time.Now(),
		}
		
		// Envia os dados para o servidor
		if err := sendData(clientData); err != nil {
			log.Printf("Erro ao enviar dados: %v", err)
		} else {
			log.Println("Dados enviados com sucesso")
		}
		
		// Aguarda o próximo intervalo de coleta
		time.Sleep(time.Duration(collectionInterval) * time.Second)
	}
}

// setupLogger configura o logger para salvar em arquivo
func setupLogger() {
	// Determina o diretório de logs
	logDir := "C:/APConsult/logs"
	if os.PathSeparator != '\\' {
		logDir = "/opt/APConsult/logs"
	}
	
	// Cria o diretório de logs se não existir
	if err := os.MkdirAll(logDir, 0755); err != nil {
		log.Printf("Erro ao criar diretório de logs: %v", err)
		return
	}
	
	// Abre o arquivo de log
	logFile, err := os.OpenFile(
		filepath.Join(logDir, "agent.log"),
		os.O_CREATE|os.O_WRONLY|os.O_APPEND,
		0644,
	)
	if err != nil {
		log.Printf("Erro ao abrir arquivo de log: %v", err)
		return
	}
	
	// Configura o logger para escrever no arquivo
	log.SetOutput(logFile)
}

// registerClient registra o cliente no servidor
func registerClient(clientID string) error {
	// Obtém o nome personalizado, se existir
	customName, _ := clientuuid.GetCustomName()
	
	// Coleta dados do sistema
	systemInfo, err := collector.CollectSystemInfo()
	if err != nil {
		return fmt.Errorf("erro ao coletar dados do sistema: %v", err)
	}
	
	// Prepara os dados de registro
	registerData := ClientData{
		ClientID:    clientID,
		CustomName:  customName,
		SystemInfo:  systemInfo,
		CollectedAt: time.Now(),
	}
	
	// Converte para JSON
	jsonData, err := json.Marshal(registerData)
	if err != nil {
		return fmt.Errorf("erro ao converter dados para JSON: %v", err)
	}
	
	// Criptografa os dados
	encryptedData, err := crypto.Encrypt(jsonData, []byte(encryptionKey))
	if err != nil {
		return fmt.Errorf("erro ao criptografar dados: %v", err)
	}
	
	// Prepara a requisição
	req, err := http.NewRequest("POST", serverURL+registerEndpoint, bytes.NewBufferString(encryptedData))
	if err != nil {
		return fmt.Errorf("erro ao criar requisição: %v", err)
	}
	
	// Configura os headers
	req.Header.Set("Content-Type", "application/text")
	req.Header.Set("User-Agent", "APConsult-Agent/1.0")
	
	// Configura o cliente HTTP com TLS
	client := &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				MinVersion: tls.VersionTLS12,
			},
		},
	}
	
	// Envia a requisição
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("erro ao enviar requisição: %v", err)
	}
	defer resp.Body.Close()
	
	// Verifica o status da resposta
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := ioutil.ReadAll(resp.Body)
		return fmt.Errorf("erro do servidor: %d - %s", resp.StatusCode, string(body))
	}
	
	return nil
}

// sendData envia os dados coletados para o servidor
func sendData(clientData ClientData) error {
	// Converte para JSON
	jsonData, err := json.Marshal(clientData)
	if err != nil {
		return fmt.Errorf("erro ao converter dados para JSON: %v", err)
	}
	
	// Criptografa os dados
	encryptedData, err := crypto.Encrypt(jsonData, []byte(encryptionKey))
	if err != nil {
		return fmt.Errorf("erro ao criptografar dados: %v", err)
	}
	
	// Prepara a requisição
	req, err := http.NewRequest("POST", serverURL+dataEndpoint, bytes.NewBufferString(encryptedData))
	if err != nil {
		return fmt.Errorf("erro ao criar requisição: %v", err)
	}
	
	// Configura os headers
	req.Header.Set("Content-Type", "application/text")
	req.Header.Set("User-Agent", "APConsult-Agent/1.0")
	
	// Configura o cliente HTTP com TLS
	client := &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				MinVersion: tls.VersionTLS12,
			},
		},
	}
	
	// Envia a requisição
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("erro ao enviar requisição: %v", err)
	}
	defer resp.Body.Close()
	
	// Verifica o status da resposta
	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return fmt.Errorf("erro do servidor: %d - %s", resp.StatusCode, string(body))
	}
	
	return nil
} 