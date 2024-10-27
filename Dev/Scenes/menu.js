import { io } from 'socket.io-client';

var socket = io('http://localhost:3000');

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'scene-menu' });
    }


    preload() {
        // Charger des ressources si nécessaire (par exemple des images pour les boutons)
    }

    create() {
        socket.emit('playerState', { inGame: false });

        let inputText = '';
        const title = this.add.text(400, 300, 'BRDGame', { fontSize: '48px', fill: '#fff' })
        .setOrigin(0.5, 0.5)
        .setPosition(this.cameras.main.width / 2, this.cameras.main.height * 0.4);

        const inputDisplayText = this.add.text(400, 300, '', { fontSize: '32px', fill: '#fff' })
        .setOrigin(0.5,0.5)
        .setPosition(this.cameras.main.width / 2, this.cameras.main.height * 0.6);

        const displayText = this.add.text(400, 300, 'Entrez votre nom :', { fontSize: '32px', fill: '#fff' })
            .setOrigin(0.5,0.5)
            .setPosition(this.cameras.main.width / 2, this.cameras.main.height * 0.5);
            this.input.keyboard.on('keydown', (event) => {
                if (event.key === 'Enter') {
                } else if (event.key === 'Backspace') {
                    inputText = inputText.slice(0, -1);
                } else if (event.key.length === 1 && inputText.length < 25) {
                    inputText += event.key;
                }

                inputDisplayText.setText(inputText);

                });

        const startButton = this.add.text(200, 300, 'Start', { fontSize: '32px', fill: '#fff' })
            .setOrigin(0.5,0.5)
            .setPosition(this.cameras.main.width / 2, this.cameras.main.height *0.8)
            .setInteractive();

        const profilButton = this.add.text(200, 300, 'Profil', { fontSize: '24px', fill: '#fff' })
            .setOrigin(0,0.5)
            .setPosition(this.cameras.main.width * 0.05, this.cameras.main.height *0.05)
            .setInteractive();

        const paramButton = this.add.text(200, 300, 'Paramètre', { fontSize: '24px', fill: '#fff' })
            .setOrigin(0,0.5)
            .setPosition(this.cameras.main.width * 0.05, this.cameras.main.height *0.1)
            .setInteractive();

        const shopButton = this.add.text(200, 300, 'Boutique', { fontSize: '24px', fill: '#fff' })
            .setOrigin(0,0.5)
            .setPosition(this.cameras.main.width * 0.05, this.cameras.main.height *0.15 )
            .setInteractive();

        startButton.on('pointerdown', () => {
            if(inputDisplayText.text !== ''){
                this.scene.start('scene-game', { socket });
            }
        });

        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#ff0' });
        });

        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#fff' });
        });
    }
}

