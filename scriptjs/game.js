kaboom({  // Configurações globais da biblioteca Kaboom.js
    global: true, 
    fullscreen: true,
    scale: 2, 
    debug: true,
    clearColor: [0,0,0,1], 
})

const MOVE_SPEED = 120 //Velocidade de movimento do Mário.
const JUMP_FORCE = 360 //Altura do pulo do Mário.
const BIG_JUMP_FORCE = 420
let CURRENT_JUMP_FORCE = JUMP_FORCE
const ENEMY_SPEED = 20
let isJumping = true
const FALL_DEATH = 400

loadRoot("/imagens/") //Trazendo para dentro do programa as imagens dos objetos.
loadSprite("coin", "2 - wbKxhcd.png")
loadSprite('evil-shroom', '3 - KPO3fR9.png')
loadSprite('brick', '1 - pogC9x5.png')
loadSprite('block', 'M6rwarW.png')
loadSprite('mario', '6 - Wb1qfhK.png')
loadSprite('mushroom', '7 - 0wMd92p.png')
loadSprite('surprise', '9 - gesQ1KP.png')
loadSprite('unboxed', '10 - bdrLpi6.png')
loadSprite('pipe-top-left', '14 - ReTPiWY.png')
loadSprite('pipe-top-right', '13 - hj2GK4n.png')
loadSprite('pipe-bottom-left', '11 - c1cYSbt.png')
loadSprite('pipe-bottom-right', '12 - nqQ79eI.png')

loadSprite('blue-block', 'fVscIbn.png')
loadSprite('blue-brick', '15 - 3e5YRQd.png')
loadSprite('blue-steel', 'gqVoI2b.png')
loadSprite('blue-evil-shroom', '16 - SvV4ueD.png')
loadSprite('blue-surprise', 'RMqCc1G.png')





scene("game", ( {level, score } ) => {
    layers(["bg", "obj", "ui"], "obj")

    const maps = [
        [ 
        '                                      ',
        '                                      ',
        '                                      ',
        '                                      ',
        '                                      ',
        '                                      ',
        '     %    =*=%=                       ',
        '                                      ',
        '                            -+        ',
        '                      ^   ^ ()        ',
        '==============================   =====',
        ],
        [
        ']                                             ]',
        ']                                             ]',
        ']                                             ]',
        ']                                             ]',
        ']                                             ]',
        ']                                             ]',
        ']        @@@@@@@                 x x          ]',
        ']                              x x x          ]',
        ']                            x x x x x      -+]',
        ']                     [ [  x x x x x x      ()]',
        '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
        ],
    ] 

    const levelCfg = {  // invocação das sprites no mapa
        width: 20,
        height: 20,
        '=': [sprite("block"), solid()],
        '$': [sprite('coin'), 'coin'],
        '%': [sprite('surprise'), solid(), 'coin-surprise'],
        '*': [sprite('surprise'), solid(), 'mushroom-surprise'],
        '}': [sprite('unboxed'), solid()],
        '(': [sprite('pipe-bottom-left'), solid(), scale(0.5)],
        ')': [sprite('pipe-bottom-right'), solid(), scale(0.5)],
        '-': [sprite('pipe-top-left'), solid(), scale(0.5), 'pipe'],
        '+': [sprite('pipe-top-right'), solid(), scale(0.5), 'pipe'],
        '^': [sprite('evil-shroom'), solid(), 'dangerous'],
        '#': [sprite('mushroom'), solid(), 'mushroom', body()],
        '!': [sprite('blue-block'), solid(), scale(0.5)],
        ']': [sprite('blue-brick'), solid(), scale(0.5)],
        '[': [sprite('blue-evil-shroom'), solid(), scale(0.5), 'dangerous'],
        '@': [sprite('blue-surprise'), solid(), scale(0.5), 'coin-surprise'],
        'x': [sprite('blue-steel'), solid(), scale(0.5)],
    }

    const gameLevel = addLevel(maps[level], levelCfg) //criação da constante para juntar o mapa e os objetos do mapa.

    const scoreLabel = add([ //Valor das vidas.
        text(score),
        pos(30, 6),
        layer('ui'),
        {
            value: score,
        }
    ])

    add([text('Level' + parseInt(level+1)), pos(4, 20)])

    function big() {  // função para deixar o mário grande
        let timer = 0 
        let isBig = false
        return {
            update() {
                if(isBig) {                   
                    timer -= dt()
                    CURRENT_JUMP_FORCE = BIG_JUMP_FORCE
                    if(timer <= 0) {
                        this.smallify()
                    }
                }
            },
            isBig() {
                return isBig
            },
            smallify() {
                this.scale = vec2(1)
                CURRENT_JUMP_FORCE = JUMP_FORCE
                timer = 0
                isBig = false
            },
            biggify(time) {
                this.scale = vec2(1.5)
                timer = time
                isBig = true
            }
        }
    }
    
    const player = add([   //Criação do Mario
        sprite('mario'), solid(),
        pos(30, 0),
        body(),
        big(),
        origin('bot'),
    ])

    action('mushroom', (m) => { //movimento no cogumelo
        m.move(20, 0)
    })

    player.on('headbump', (obj) => { //Destruindo blocos com a cabeçada do mario
        if(obj.is('coin-surprise')) { // Se o obj é 'coin-surprise'
            gameLevel.spawn('$', obj.gridPos.sub(0, 1)) //ele invoca a função gameLevel, e cria um objeto do tipo coin
            destroy(obj)         // destrói o objeto     
            gameLevel.spawn('}', obj.gridPos.sub(0, 0)) // e spawna um bloco unboxed
        }
        if(obj.is('mushroom-surprise')) { //Mesma coisa do IF anterior, porém com cogumelos.
            gameLevel.spawn('#', obj.gridPos.sub(0, 1))
            destroy(obj)
            gameLevel.spawn('}', obj.gridPos.sub(0, 0))
        }
    })

    //Movimentos do Mario e colisões com os objetos.

    player.collides('mushroom', (m) => {
        destroy(m)
        player.biggify(6)
    })

    player.collides('coin', (y) => {
        destroy(y)
        scoreLabel.value++
        scoreLabel.text = scoreLabel.value
    })

    action('dangerous', (d) => { // Dando movimento ao cogumelo do mal
        d.move(-ENEMY_SPEED, 0)
    })

    player.collides('dangerous', (d) => { //Caso o Mário Toque em algum cogumelo, ele perde e o programa vai direto para cena 'lose'
        if(isJumping) {
            destroy(d)
        } else {
            go('lose', {score: scoreLabel.value})
        }       
    })

    player.action(() => { //função criada no intuito da camera seguir o mario
        camPos(player.pos) // declaração para a posição da camera seguir a posição do player
        if(player.pos.y >= FALL_DEATH) { // se a posição for maior ou igual a constante FALL_DEATH que tem o valor de 400
            go('lose', { score: scoreLabel.value}) //vai para a cena de "lose" e aparece o score com o valor na tela.
        } 
    })

    player.collides('pipe', () => { //Função criada para fazer o mário entrar no cano e mudar de fase
        keyPress('down', () => {
            go('game', {
                level: (level +1) % maps.length,
                score: scoreLabel.value
            })
        })
    })

    keyDown('left', () => {
        player.move(-MOVE_SPEED, 0) //Simbolo de menos para o Mário ir para trás.
    })

    keyDown('right', () => {    //função para o mário ir para direita
        player.move(MOVE_SPEED, 0)
    })

    player.action(() => {
        if(player.grounded()) {
            isJumping = false
        }
    })

    keyPress('space', () => { // função para o mário pular
        if(player.grounded()) {
            isJumping = true
            player.jump(CURRENT_JUMP_FORCE)
        }
    })



})

scene('lose', ({score}) => {
    add([text(score, 32), origin('center'), pos(width()/ 2, height()/ 2)])
})


start("game", {level: 0, score: 0})