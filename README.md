# Música e Voz Sintetizadas para Sistemas Multimídia

Protótipo educacional em HTML5, CSS3 e JavaScript puro, sem backend, desenvolvido para apresentar conceitos de **Música e Voz Sintetizadas para Sistemas Multimídia** por meio de conteúdos explicativos, exemplos práticos e recursos multimídia interativos.

## Como executar

Abra a pasta do projeto no VS Code e use o **Live Server** (botão "Go Live" ou clique direito em `index.html` > "Open with Live Server").

Abrir o `index.html` com duplo clique mostra o site, mas o quiz precisa de um servidor para ler `data/questions.json`.

As fontes vêm do Google Fonts; sem internet o site usa fontes do sistema.

## Estrutura

- `index.html` — todas as seções, com navegação não linear pelo header fixo.
- `css/style.css` — tema visual, responsividade e animações.
- `js/app.js` — menu, mídias, galeria e demonstração de voz pela Web Speech API.
- `js/midi-player.js` — player MIDI local utilizando Web Audio API.
- `js/quiz.js` + `data/questions.json` — quiz com 15 questões, 5 sorteadas e porcentagem final.
- `assets/` — arquivos de mídia produzidos pelo grupo.

### Organização das mídias

- `assets/images/raster/` — imagem raster.
- `assets/images/vector/` — imagem vetorial.
- `assets/audio/` — áudios digitalizados e música modificada.
- `assets/midi/` — arquivo MIDI.
- `assets/video/` — vídeo.
- `assets/animations/` — animação.

## Materiais produzidos pelo grupo

O projeto utiliza os seis tipos de mídia exigidos:

- **Imagem raster:** fotografia do grupo realizando o trabalho.
- **Imagem vetorial:** desenho de uma onda sonora em formato SVG.
- **Áudio digitalizado:** gravação de voz humana editada.
- **MIDI:** beat de piano produzido pelo grupo no BandLab.
- **Vídeo:** gravação explicando o conceito de voz sintetizada.
- **Animação:** animação de uma onda sonora produzida no Ibis Paint.

Além das seis mídias obrigatórias, o projeto possui uma **aplicação prática de edição musical** na seção "Música sintetizada".

## Música modificada

O projeto apresenta um exemplo prático de produção musical utilizando um trecho de **"In the End"**, usado como base para alterações realizadas pelo grupo.

O arquivo `assets/audio/in-the-end-trecho-editado.mp3` contém aproximadamente 27 segundos do trecho utilizado, com alterações e um beat produzido pelo grupo.

A música é apresentada diretamente no navegador por meio de um elemento de áudio HTML5, permitindo ao usuário ouvir o resultado da edição.

A música original é de terceiros e é utilizada apenas como base para a demonstração do processo de alteração musical.

## Voz sintetizada

O laboratório de voz utiliza a **Web Speech API** do navegador para transformar texto em fala.

O usuário pode:

- escrever um texto;
- selecionar uma voz disponível em português;
- ajustar a velocidade;
- ajustar o tom;
- reproduzir e interromper a fala sintetizada.

## MIDI

O projeto utiliza um player MIDI desenvolvido localmente em `js/midi-player.js`.

O player utiliza a **Web Audio API** para reproduzir o arquivo MIDI diretamente no navegador, sem depender de bibliotecas externas.

Também é disponibilizado um botão para baixar o arquivo MIDI utilizado no protótipo.

## Quiz

O arquivo `data/questions.json` contém 15 questões.

A cada tentativa, o sistema:

1. embaralha as questões;
2. seleciona 5 delas;
3. apresenta uma questão por vez;
4. informa a resposta correta e sua explicação;
5. apresenta a porcentagem de acertos ao final.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Web Speech API
- Web Audio API
- Canvas 2D
- SVG
- Fetch API
- Google Fonts
- Live Server
- Ibis Paint
- BandLab

## Créditos

**Projeto:** SinteSom — Música e Voz Sintetizadas para Sistemas Multimídia

**Grupo:**
- Allan Felipe Aguiar Araújo — 01731530
- Davi Lopes de Melo — 01730826
- Emanuel Roberto Feliciano Vieira — 01752260
- João Henrique da Silva Lima — 01696493
- João Henrique Moura Freitas — 01722388

**Instituição:** UNINASSAU

**Disciplina:** Sistemas Multimídia

**Professor:** Leopoldo Rodrigues Franca Neto

**Autoria dos materiais:** Produção própria do grupo.

**Ferramentas:** HTML, CSS, JavaScript, Ibis Paint e BandLab.

**Referências:** Web APIs e ferramentas utilizadas no desenvolvimento do projeto. A música "In the End", utilizada como base para o exemplo de música modificada, é de terceiros.