@echo off
echo ===================================
echo Instalador do Agente APConsult
echo ===================================

:: Verifica permissões de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Erro: Este instalador precisa ser executado como administrador.
    echo Por favor, clique com o botão direito e selecione "Executar como administrador".
    pause
    exit /b 1
)

:: Cria diretório de instalação
echo Criando diretório de instalação...
mkdir C:\APConsult 2>nul
mkdir C:\APConsult\logs 2>nul

:: Copia os arquivos
echo Copiando arquivos...
copy /Y agent.exe C:\APConsult\
copy /Y rustdesk.exe C:\APConsult\ 2>nul

:: Verifica se o arquivo de consentimento já existe
if not exist C:\APConsult\consent.dat (
    echo.
    echo ===================================
    echo TERMOS DE CONSENTIMENTO
    echo ===================================
    echo.
    echo Este software coleta informações do sistema como:
    echo - Uso de CPU, memória e disco
    echo - Versão do sistema operacional
    echo - Nome do computador
    echo.
    echo Estas informações são usadas apenas para fins de monitoramento
    echo e suporte técnico. Todos os dados são criptografados e tratados
    echo de acordo com a LGPD (Lei Geral de Proteção de Dados).
    echo.
    echo Você concorda com a coleta destas informações?
    echo.
    
    set /p consent="Digite 'sim' para concordar ou qualquer outra tecla para cancelar: "
    
    if /i not "%consent%"=="sim" (
        echo.
        echo Instalação cancelada pelo usuário.
        pause
        exit /b 1
    )
    
    echo sim > C:\APConsult\consent.dat
    echo.
    echo Consentimento registrado. Obrigado!
)

:: Registra o serviço
echo Registrando serviço...
sc create APConsultAgent binPath= "C:\APConsult\agent.exe" start= auto displayname= "APConsult Monitoring Agent"
sc description APConsultAgent "Agente de monitoramento para suporte técnico remoto"

:: Inicia o serviço
echo Iniciando serviço...
sc start APConsultAgent

:: Configura o RustDesk se existir
if exist C:\APConsult\rustdesk.exe (
    echo Configurando RustDesk...
    C:\APConsult\rustdesk.exe --install-service --server api.apconsult.com.br:21115
)

echo.
echo ===================================
echo Instalação concluída com sucesso!
echo ===================================
echo.
echo O agente APConsult foi instalado e está em execução.
echo.
pause 