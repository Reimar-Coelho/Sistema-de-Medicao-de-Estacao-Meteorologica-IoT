import serial, json, requests, time, os

PORTA = os.getenv('PORTA')
BAUD_RATE = os.getenv('BAUD_RATE')
URL = os.getenv('URL')

def ler_serial():
    with serial.Serial(PORTA, BAUD_RATE) as ser:
        while True:
            linha = ser.readline().decode('utf-8').strip()
            if linha:
                try:
                    dados = json.loads(linha)
                    requests.post(URL, json=dados)
                    print(f"Dados enviados: {dados}")
                except json.JSONDecodeError:
                    print(f"Linha inválida: {linha}")
                time.sleep(0.1)

if __name__ == "__main__":
    ler_serial()