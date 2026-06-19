# Rostinho

<p>
  Aplicativo para gerar etiquetas A4 utilizadas na identificação e armazenagem de pallets na Toyota do Brasil.
</p>

## Visão geral

O **Rostinho** é um aplicativo web empacotado para Android com **Capacitor**.

A interface fica em `www/` e foi desenvolvida com HTML, CSS e JavaScript puro. O projeto não possui build web separado: os arquivos de `www/` são testados diretamente no navegador e depois copiados para o Android pelo Capacitor.

---

# Para desenvolvimento

## Onde editar

### Interface do app

Edite a estrutura e o visual das telas em:

```text
www/index.html
www/src/css/style.css
```

### Etiqueta A4

Edite a etiqueta gerada em PDF em:

```text
www/src/JS/modules/printData.js
```

Nesse arquivo ficam o layout da etiqueta, textos fixos, posições, tamanhos de fonte, barras pretas, QR Codes e a geração do PDF.

### Lógica do app

Os módulos JavaScript ficam em:

```text
www/src/JS/
www/src/JS/modules/
```

### Sons do app

Os arquivos de áudio ficam em:

```text
www/src/audio/error.wav
www/src/audio/scan.wav
www/src/audio/success.wav
```

O módulo que carrega e toca esses arquivos fica em:

```text
www/src/JS/modules/audio.js
```

Nesse arquivo existe um objeto `sounds` com os áudios pré-carregados:

- `error`: usado pelos alertas de erro.
- `scan`: usado quando um part-number é lido corretamente no modo AUTO.
- `successSound`: usado nas ações de sucesso, como troca de tela e PRINT sem erros.

As funções públicas resetam o áudio com `currentTime = 0` antes de tocar, permitindo repetir o mesmo som várias vezes seguidas:

- `playErrorSound()`: toca `sounds.error`.
- `playScanSound()`: toca `sounds.scan`.
- `playSuccessSound()`: toca `sounds.successSound`.

Para mudar algum som, substitua o respectivo arquivo `.wav` em `www/src/audio/` mantendo o mesmo nome, ou atualize o caminho no objeto `sounds`.

Arquivos principais:

| Arquivo                           | Responsabilidade                                          |
| --------------------------------- | --------------------------------------------------------- |
| `www/src/JS/main.js`              | Inicialização e eventos principais.                       |
| `www/src/JS/modules/state.js`     | Estado compartilhado do app.                              |
| `www/src/JS/modules/keyboard.js`  | Atalhos e fluxo pelo teclado/scanner.                     |
| `www/src/JS/modules/utils.js`     | Foco, troca de telas, limpeza e modo AUTO/MANUAL.         |
| `www/src/JS/modules/audio.js`     | Carrega e toca os arquivos WAV de erro, scan e sucesso.   |
| `www/src/JS/modules/printData.js` | Layout da etiqueta, geração do PDF, QR Codes e impressão. |

## Modo debug

O app possui uma flag global de debug criada em:

```text
www/src/JS/main.js
```

Por padrão ela deve ficar desligada:

```js
window.debug = false;
```

Para investigar o fluxo do app durante o desenvolvimento, existem duas opções:

- No editor, altere temporariamente o valor inicial em `main.js`.
- No navegador, altere diretamente pelo console, sem editar arquivo.

Em ambos os casos, ligue com:

```js
window.debug = true;
```

Para desligar novamente sem recarregar a página:

```js
window.debug = false;
```

Com `window.debug = true`, alguns logs de diagnóstico em `utils.js` e `printData.js` são exibidos no console, incluindo troca de tela, modo AUTO/MANUAL, alertas, part-number lido e dados enviados para impressão.

Antes de gerar o APK para uso no coletor, confirme que o valor inicial em `main.js` está desligado:

```js
window.debug = false;
```

## Requisitos do ambiente

- Node.js 22 ou superior.
- npm.
- JDK 21 recomendado, ou JDK 17 no mínimo.
- Android SDK Platform 36 e Build-Tools 36.0.0.
- Gradle Wrapper do próprio projeto.

## Preparar JDK e Android SDK

### JDK 21 ou 17

Baixe e instale um JDK 21. O projeto também pode ser buildado com JDK 17 ou superior, mas JDK 21 é a versão recomendada para manter o ambiente alinhado com máquinas atuais.

Opções recomendadas:

- [Eclipse Temurin JDK 21](https://adoptium.net/temurin/releases/?version=21)
- [Microsoft Build of OpenJDK](https://learn.microsoft.com/en-us/java/openjdk/download)

No Windows, baixe o instalador `.msi` ou `.exe` para `Windows x64`, execute o instalador e conclua a instalação.

Depois, confira no terminal:

```powershell
java -version
```

O resultado deve mostrar Java 21, ou pelo menos Java 17.

Se o comando não for reconhecido, configure a variável de ambiente `JAVA_HOME` apontando para a pasta do JDK instalado e adicione `%JAVA_HOME%\bin` ao `Path`.

### Android SDK

O `npm install` instala as dependências JavaScript do projeto, incluindo Capacitor. Ele não instala o Android SDK.

Para gerar o APK, a máquina precisa ter o Android SDK já instalado com:

- `Android SDK Platform 36`
- `Android SDK Build-Tools 36.0.0`
- `Android SDK Platform-Tools`

O caminho do SDK normalmente fica em:

```text
C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk
```

## Requisitos Android

```text
Android mínimo: Android 7.0 Nougat, API 24
compileSdkVersion: 36
targetSdkVersion: 36
```

As versões Android ficam em:

```text
android/variables.gradle
```

O arquivo `android/local.properties` aponta para o Android SDK da máquina local. Se ele não existir, crie esse arquivo dentro da pasta `android/`.

Esse arquivo não deve ser reutilizado entre computadores sem ajuste, pois normalmente contém um caminho específico do usuário, por exemplo:

```properties
sdk.dir=C:\\Users\\SEU_USUARIO\\AppData\\Local\\Android\\Sdk
```

Em outra máquina, crie ou edite esse arquivo com o caminho correto do Android SDK instalado:

```properties
sdk.dir=C:\\Users\\SEU_USUARIO\\AppData\\Local\\Android\\Sdk
```

## Instalar dependências

Execute na raiz do projeto:

```bash
npm install
```

## Testar no navegador

Para testar no navegador, rode um servidor local apontando para a pasta `www`.

Opção com Python, executando na raiz do projeto:

```bash
python -m http.server 8080 -d www
```

Depois acesse:

```text
http://localhost:8080
```

Outra opção é usar uma extensão como **Live Server** no VS Code e servir a pasta `www`.

Use esse teste para conferir alterações de tela, leitura, quantidade e geração da etiqueta antes de criar o APK.

## Gerar APK para Android

### 1. Sincronizar o Capacitor

Depois de testar no navegador, execute na raiz do projeto:

```bash
npx cap sync android
```

Esse comando copia o conteúdo de `www/` para o projeto Android.

### 2. Entrar na pasta Android

```bash
cd android
```

### 3. Gerar o APK debug

Execute dentro da pasta `android`:

```powershell
.\gradlew.bat assembleDebug
```

### 4. Localizar o APK

O APK gerado fica em:

```text
Rostinho\android\app\build\outputs\apk\debug\app-debug.apk
```

Esse é o arquivo que deve ser copiado para o coletor e instalado.

## Atualizar app no coletor

Para atualizar o app:

1. Gere um novo `app-debug.apk`.
2. Desinstale a versão antiga no coletor.
3. Instale o novo APK.

Como a atualização será feita por desinstalação e nova instalação, o `app-debug.apk` atende ao fluxo de uso interno do projeto.

## Capacitor

O Capacitor usa a pasta `www` como origem do app web.

Configuração:

```text
capacitor.config.json
```

Conteúdo atual:

```json
{
  "appId": "com.Rostinho.app",
  "appName": "Rostinho",
  "webDir": "www"
}
```

## Estrutura do projeto

```text
Rostinho/
|-- android/
|   `-- app/                  Projeto Android do Capacitor
|-- icons/                    Ícones exportados
|-- resources/                Recursos base de ícone/splash
|-- www/
|   |-- index.html            Estrutura da interface
|   `-- src/
|       |-- audio/            Sons WAV do app
|       |-- css/
|       |   `-- style.css     Estilos da interface
|       |-- img/              Imagens e logos
|       `-- JS/
|           |-- main.js       Inicialização do app
|           |-- lib/          Bibliotecas locais
|           `-- modules/      Módulos da aplicação
|-- capacitor.config.json
|-- package.json
|-- package-lock.json
`-- README.md
```

## Dependências principais

- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/android`
- `@capacitor/assets`
- `qrcode-lib.js`, salvo localmente em `www/src/JS/lib`
- `jspdf-lib.js`, salvo localmente em `www/src/JS/lib`

---

# Para usuário

## Fluxo de uso

1. Informe o nome do operador na primeira tela.
2. Na tela seguinte, leia ou digite o part-number.
3. Use o modo AUTO para contar leituras repetidas do mesmo part-number.
4. Use o modo MANUAL para preencher part-number e quantidade manualmente.
5. Pressione PRINT para gerar a etiqueta.
6. Instale ou imprima conforme o fluxo configurado no coletor.

## Modos de operação

| Modo   | Como funciona                                                                       |
| ------ | ----------------------------------------------------------------------------------- |
| AUTO   | A quantidade fica bloqueada e aumenta a cada leitura repetida do mesmo part-number. |
| MANUAL | Part-number e quantidade ficam liberados para preenchimento manual.                 |

O botão **MODE** alterna entre AUTO e MANUAL.

## Atalhos de teclado

| Tecla                  | Ação                                                      |
| ---------------------- | --------------------------------------------------------- |
| `Enter`, `Tab` ou `F4` | Confirma o fluxo atual. No modo AUTO, registra a leitura. |
| `F1`                   | Imprime a etiqueta.                                       |
| `F2`                   | Limpa os campos.                                          |
| `F3`                   | Alterna entre AUTO e MANUAL.                              |
| `F9`                   | Volta para a tela do operador.                            |
| `Seta para cima/baixo` | Alterna entre campos no modo MANUAL.                      |

Algumas teclas do navegador são bloqueadas para evitar saídas acidentais durante o uso em terminal.

## Observações de uso

- O app foi pensado para uso interno.
- O APK usado no coletor é o `app-debug.apk`.
- Para atualizar, desinstale a versão antiga e instale o APK novo.

## Autor

Marcos Matusalem - 2026
