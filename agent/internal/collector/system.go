package collector

import (
	"fmt"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
)

// SystemInfo representa as informações coletadas do sistema
type SystemInfo struct {
	Hostname     string    `json:"hostname"`
	OS           string    `json:"os"`
	Platform     string    `json:"platform"`
	CPUUsage     float64   `json:"cpu_usage"`
	MemoryTotal  uint64    `json:"memory_total"`
	MemoryUsed   uint64    `json:"memory_used"`
	MemoryUsage  float64   `json:"memory_usage"`
	DiskTotal    uint64    `json:"disk_total"`
	DiskUsed     uint64    `json:"disk_used"`
	DiskUsage    float64   `json:"disk_usage"`
	CollectedAt  time.Time `json:"collected_at"`
}

// CollectSystemInfo coleta informações do sistema
func CollectSystemInfo() (*SystemInfo, error) {
	// Coleta informações do host
	hostInfo, err := host.Info()
	if err != nil {
		return nil, fmt.Errorf("erro ao coletar informações do host: %v", err)
	}

	// Coleta uso de CPU
	cpuPercent, err := cpu.Percent(time.Second, false)
	if err != nil {
		return nil, fmt.Errorf("erro ao coletar uso de CPU: %v", err)
	}

	// Coleta informações de memória
	memInfo, err := mem.VirtualMemory()
	if err != nil {
		return nil, fmt.Errorf("erro ao coletar informações de memória: %v", err)
	}

	// Coleta informações de disco
	diskInfo, err := disk.Usage("/")
	if err != nil {
		// Em caso de erro no Linux/Mac, tenta o caminho do Windows
		diskInfo, err = disk.Usage("C:")
		if err != nil {
			return nil, fmt.Errorf("erro ao coletar informações de disco: %v", err)
		}
	}

	return &SystemInfo{
		Hostname:     hostInfo.Hostname,
		OS:           hostInfo.OS,
		Platform:     hostInfo.Platform,
		CPUUsage:     cpuPercent[0],
		MemoryTotal:  memInfo.Total,
		MemoryUsed:   memInfo.Used,
		MemoryUsage:  memInfo.UsedPercent,
		DiskTotal:    diskInfo.Total,
		DiskUsed:     diskInfo.Used,
		DiskUsage:    diskInfo.UsedPercent,
		CollectedAt:  time.Now(),
	}, nil
} 