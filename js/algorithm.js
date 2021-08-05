// import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';

class Game {
    mainBall
    balls
    renderer
    scene
    camera
    reflectionsMap
    reflectionCamera
    ballSize
    boardsWidth
    fieldWidth
    fieldHeight
    distance
    mainBallLoosed = false;

    constructor(fieldSize, ballSize, boardsWidth, cameraViewWidth, isPerspective = false) {
        this.balls = []
        this.setUpSizes(fieldSize, ballSize, cameraViewWidth, boardsWidth)
        this.setUpScene()
        this.setUpRenderer()
        this.setUpCamera(isPerspective, cameraViewWidth)
        this.setUpReflectionCamera(20)
        this.setUpLights()
        Ball.init(this.fieldHeight, this.fieldWidth, ballSize, boardsWidth + ballSize)
        this.loadTextures()
    }

    setUpSizes(fieldSize, ballSize, cameraViewWidth, boardsWidth) {
        if (window.innerWidth > window.innerHeight) {
            this.fieldWidth = fieldSize
            this.fieldHeight = fieldSize / window.innerWidth * window.innerHeight
        } else {
            this.fieldHeight = fieldSize
            this.fieldWidth = fieldSize / window.innerHeight * window.innerWidth
        }
        this.distance = fieldSize / 2 / Math.tan(Math.PI / 180 * cameraViewWidth / 2)
        this.ballSize = ballSize
        this.boardsWidth = boardsWidth
    }

    setUpScene() {
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x000000)
    }

    setUpRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('field'),
            antialiasing: true
        })
        this.renderer.shadowMap.enabled = true;
        // if screen is small then another shadow type to increase performance
        this.renderer.shadowMap.type = window.innerWidth < 500 ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    setUpCamera(isPerspective, cameraViewWidth) {
        if (isPerspective) {
            this.camera = new THREE.PerspectiveCamera(
                cameraViewWidth / 4 * 3,
                window.innerWidth / window.innerHeight,
                this.distance / 10, this.distance * 10)
            new OrbitControls(this.camera, this.renderer.domElement);
        } else {
            this.camera = new THREE.OrthographicCamera(
                -this.fieldWidth / 2, this.fieldWidth / 2, this.fieldHeight / 2, -this.fieldHeight / 2,
                this.distance - this.ballSize * 2.2, this.distance * 1.1
            )
        }
        this.camera.position.set(0, 0, this.distance + 0.1)
    }

    setUpReflectionCamera(quality) {
        this.reflectionsMap = new THREE.WebGLCubeRenderTarget(quality, {
            format: THREE.RGBFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter
        });
        this.reflectionCamera = new THREE.CubeCamera(1, 50, this.reflectionsMap)
        this.reflectionCamera.position.set(0, 0, this.ballSize)
        this.scene.add(this.reflectionCamera)
    }

    setUpLights() {
        const light1 = new THREE.SpotLight(0xffeedd, 0.79, 0)
        const light2 = new THREE.SpotLight(0xffeedd, 0.81, 0)
        const light3 = new THREE.SpotLight(0xffeedd, 0.79, 0)
        if (window.innerWidth > window.innerHeight) {
            light1.position.set(-this.fieldWidth / 2.9, 0, this.fieldHeight / 1.27)
            light2.position.set(0, 0, this.fieldHeight / 1)
            light3.position.set(this.fieldWidth / 2.9, 0, this.fieldHeight / 1.27)
        } else {
            light1.position.set(0, -this.fieldHeight / 2.9, this.fieldWidth / 1.27)
            light2.position.set(0, 0, this.fieldWidth / 1)
            light3.position.set(0, this.fieldHeight / 2.9, this.fieldWidth / 1.27)
        }
        this.setUpLamp(light2)
        this.setUpLamp(light3)
        this.setUpLamp(light1)
    }

    setUpLamp(light) {
        // if screen is small then bigger shadowMap
        // because of the another shadow type to increase performance
        const shadowMapSize = window.innerWidth < 500 ? 2048 : 1024
        light.castShadow = true
        light.shadow.mapSize.width = shadowMapSize; // default 512
        light.shadow.mapSize.height = shadowMapSize; // default 512
        light.shadow.camera.near = 0.5; // default 0.5
        light.shadow.camera.far = 100 //default 500;
        light.target.position.x = light.position.x
        light.target.position.y = light.position.y
        light.penumbra = 0.2
        const material = new THREE.MeshBasicMaterial()
        const geometry = new THREE.SphereGeometry(this.fieldHeight / 9, 9, 9)
        const lamp = new THREE.Mesh(geometry, material)
        lamp.position.copy(light.position)
        this.scene.add(lamp)
        this.scene.add(light)
        this.scene.add(light.target)
        //const helper = new THREE.CameraHelper( light.shadow.camera );
        //scene.add( helper );
    }

    loadTextures() {
        this.textures = {
            fieldTexture: 'img/green.png',
            boardsTexture: 'img/wood4.jpg',
            boardsRoughnessMap: 'img/wood.jpg',
            holeTexture: 'img/hole.png'
        }
        const loader = new THREE.TextureLoader()
        loader.setCrossOrigin('anonymous')
        loader.load(this.textures.fieldTexture, texture1 => {
            this.textures.fieldTexture = texture1
            increaseLoadedObjects();
            loader.load(this.textures.boardsTexture, texture2 => {
                this.textures.boardsTexture = texture2
                increaseLoadedObjects();
                loader.load(this.textures.holeTexture, texture3 => {
                    this.textures.holeTexture = texture3;
                    increaseLoadedObjects();
                    loader.load(this.textures.boardsRoughnessMap, texture4 => {
                        this.textures.boardsRoughnessMap = texture4
                        increaseLoadedObjects();
                        this.setUpBackground()
                        this.reflectionCamera.update(this.renderer, this.scene)
                        this.setUpBoards()
                        this.setUpInsideBoards()
                        this.generateBalls()
                        this.textures = undefined
                    })
                })
            })
        })
    }

    setUpBackground() {
        let texture = this.textures.fieldTexture
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(6, Math.round(6 * window.innerHeight / window.innerWidth))
        let geometry = new THREE.PlaneGeometry(
            this.fieldWidth,
            this.fieldHeight, 2, 2)
        let material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 1,
            metalness: 0.5,
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.receiveShadow = true
        this.scene.add(plane);

        texture = this.textures.holeTexture
        geometry = new THREE.PlaneGeometry(
            this.ballSize * 5.75,
            this.ballSize * 5.75, 2, 2)
        material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 1,
            metalness: 0.5,
            transparent: true
        });
        let hole = new THREE.Mesh(geometry, material)
        hole.position.set(
            this.fieldWidth / 2 - this.ballSize * 2.5,
            this.fieldHeight / 2 - this.ballSize * 2.5, 0.01)
        this.scene.add(hole);
        hole = new THREE.Mesh(geometry, material)
        hole.position.set(
            - this.fieldWidth / 2 + this.ballSize * 2.5,
            this.fieldHeight / 2 - this.ballSize * 2.5, 0.01)
        this.scene.add(hole);
        hole = new THREE.Mesh(geometry, material)
        hole.position.set(
            - this.fieldWidth / 2 + this.ballSize * 2.5,
            - this.fieldHeight / 2 + this.ballSize * 2.5, 0.01)
        this.scene.add(hole);hole = new THREE.Mesh(geometry, material)
        hole.position.set(
            this.fieldWidth / 2 - this.ballSize * 2.5,
            - this.fieldHeight / 2 + this.ballSize * 2.5, 0.01)
        this.scene.add(hole);
        if (window.innerWidth >= window.innerHeight) {
            hole = new THREE.Mesh(geometry, material)
            hole.position.set(0, -this.fieldHeight / 2 + this.boardsWidth / 1.8, 0.01)
            this.scene.add(hole);
            hole = new THREE.Mesh(geometry, material)
            hole.position.set(0, this.fieldHeight / 2 - this.boardsWidth / 1.8, 0.01)
            this.scene.add(hole);
        } else {
            hole = new THREE.Mesh(geometry, material)
            hole.position.set(-this.fieldWidth / 2 + this.boardsWidth / 1.8, 0, 0.01)
            this.scene.add(hole);
            hole = new THREE.Mesh(geometry, material)
            hole.position.set(this.fieldWidth / 2 - this.boardsWidth / 1.8, 0, 0.01)
            this.scene.add(hole);
        }

    }

    setUpBoards() {
        const WIDTH = window.innerWidth >= window.innerHeight ? this.fieldWidth : this.fieldHeight;
        const HEIGHT = window.innerWidth >= window.innerHeight ? this.fieldHeight : this.fieldWidth;
        let texture = this.textures.boardsTexture
        let roughnessMap = this.textures.boardsRoughnessMap
        const boardsWidth = this.boardsWidth
        const holeRadius = this.ballSize * 1.5
        const holeEntranceRadius = this.ballSize * 1.1
        roughnessMap.wrapS = THREE.RepeatWrapping
        roughnessMap.wrapT = THREE.RepeatWrapping
        roughnessMap.repeat.set(0.15, WIDTH / boardsWidth / 50)
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(0.15, WIDTH / boardsWidth / 50)
        const shape = new THREE.Shape()
        shape.moveTo(-WIDTH / 2, 0)
        shape.lineTo(-WIDTH / 2, -HEIGHT / 2)
        shape.lineTo(WIDTH / 2, -HEIGHT / 2)
        shape.lineTo(WIDTH / 2, -HEIGHT / 2 + boardsWidth)
        shape.lineTo(WIDTH / 2, 0)
        shape.lineTo(WIDTH / 2 - boardsWidth, 0)
        shape.lineTo(WIDTH / 2 - boardsWidth, -HEIGHT / 2 + boardsWidth + holeEntranceRadius * 1.414)
        shape.bezierCurveTo(
            WIDTH / 2 - boardsWidth + (holeRadius * 1.5 - holeEntranceRadius / 2 + holeRadius * 1.5) / 1.414,
            -HEIGHT / 2 + boardsWidth + holeEntranceRadius * 1.414 - (-holeRadius * 1.5 + holeEntranceRadius * 1.5 + holeRadius * 1.5) / 1.414,
            WIDTH / 2 - boardsWidth - holeEntranceRadius * 1.414 + (-holeRadius * 1.5 + holeEntranceRadius * 1.5 + holeRadius * 1.5) / 1.414,
            -HEIGHT / 2 + boardsWidth - (holeRadius * 1.5 - holeEntranceRadius / 2 + holeRadius * 1.5) / 1.414,
            WIDTH / 2 - boardsWidth - holeEntranceRadius * 1.414, -HEIGHT / 2 + boardsWidth)
        shape.lineTo(holeEntranceRadius, -HEIGHT / 2 + boardsWidth)
        shape.bezierCurveTo(
            holeRadius * 1.5, -HEIGHT / 2 + boardsWidth - holeEntranceRadius / 2 - holeRadius * 1.5,
            -holeRadius * 1.5, -HEIGHT / 2 + boardsWidth - holeEntranceRadius / 2 - holeRadius * 1.5,
            -holeEntranceRadius, -HEIGHT / 2 + boardsWidth)
        shape.lineTo(-WIDTH / 2 + boardsWidth + holeEntranceRadius * 1.414, -HEIGHT / 2 + boardsWidth)
        shape.bezierCurveTo(
            -WIDTH / 2 + boardsWidth + holeEntranceRadius * 1.414 - (-holeRadius * 1.5 + holeEntranceRadius * 1.5 + holeRadius * 1.5) / 1.414,
            -HEIGHT / 2 + boardsWidth - (holeRadius * 1.5 - holeEntranceRadius / 2 + holeRadius * 1.5) / 1.414,
            -WIDTH / 2 + boardsWidth - (holeRadius * 1.5 - holeEntranceRadius / 2 + holeRadius * 1.5) / 1.414,
            -HEIGHT / 2 + boardsWidth + holeEntranceRadius * 1.414 - (-holeRadius * 1.5 + holeEntranceRadius * 1.5 + holeRadius * 1.5) / 1.414,
            -WIDTH / 2 + boardsWidth, -HEIGHT / 2 + boardsWidth + holeEntranceRadius * 1.414)
        shape.lineTo(-WIDTH / 2 + boardsWidth, 0)
        shape.lineTo(-WIDTH / 2, 0)

        const geometry = new THREE.ExtrudeGeometry(shape, {
            steps: 1,
            depth: this.ballSize,
            bevelEnabled: false
        });
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 1,
            metalness: 0.3,
            roughnessMap: roughnessMap
        });
        const board = new THREE.Mesh(geometry, material)
        board.castShadow = true;
        if (window.innerWidth < window.innerHeight) {
            board.rotateZ(Math.PI / 2)
        }
        this.scene.add(board);
        const board2 = board.clone()
        board2.needsUpdate = true
        board2.rotateZ(Math.PI)
        this.scene.add(board2)
    }

    setUpInsideBoards() {
        const rightBottomBoard = this.createHorizontalBoard(1, 1)
        const leftBottomBoard = this.createHorizontalBoard(1, -1)
        const rightTopBoard = this.createHorizontalBoard(-1, 1)
        const leftTopBoard = this.createHorizontalBoard(-1, -1)
        const rightBoard = this.createVerticalBoard(1)
        const leftBoard = this.createVerticalBoard(-1)
        this.scene.add(rightBoard)
        this.scene.add(leftBoard)
        this.scene.add(rightBottomBoard)
        this.scene.add(leftBottomBoard)
        this.scene.add(rightTopBoard)
        this.scene.add(leftTopBoard)
    }

    createHorizontalBoard(isBottom, isRight) {
        const boardsWidth = this.boardsWidth
        const holeEntranceRadius = this.ballSize * 1.1
        const bevelSize = this.ballSize / 7
        const shape = new THREE.Shape()
        const isVertical = window.innerHeight > window.innerWidth
        const width = isVertical ? this.fieldHeight : this.fieldWidth
        const height = isVertical ? this.fieldWidth : this.fieldHeight
        let x = (width / 2 - boardsWidth - holeEntranceRadius * 1.414 - bevelSize / 2) * isRight
        let y = (-height / 2 + boardsWidth) * isBottom
        shape.moveTo(isVertical ? y : x, isVertical ? x : y)
        x = (width / 2 - boardsWidth - holeEntranceRadius * 2.414 - bevelSize / 2) * isRight
        y = (-height / 2 + boardsWidth + holeEntranceRadius - bevelSize) * isBottom
        shape.lineTo(isVertical ? y : x, isVertical ? x : y)
        x = (holeEntranceRadius + bevelSize / 2) * isRight
        y = (-height / 2 + boardsWidth + holeEntranceRadius - bevelSize) * isBottom
        shape.lineTo(isVertical ? y : x, isVertical ? x : y)
        x = (holeEntranceRadius + bevelSize / 2) * isRight
        y = (-height / 2 + boardsWidth) * isBottom
        shape.lineTo(isVertical ? y : x, isVertical ? x : y)
        x = (width / 2 - boardsWidth - holeEntranceRadius * 1.414 - bevelSize / 2) * isRight
        y = (-height / 2 + boardsWidth) * isBottom
        shape.lineTo(isVertical ? y : x, isVertical ? x : y)
        return this.createInsideBoard(shape, bevelSize)
    }

    createVerticalBoard(isRight) {
        const boardsWidth = this.boardsWidth * 0.93
        const holeEntranceRadius = this.ballSize * 1.1
        const bevelSize = this.ballSize / 7
        const shape = new THREE.Shape()
        const isVertical = window.innerHeight > window.innerWidth
        const width = isVertical ? this.fieldHeight : this.fieldWidth
        const height = isVertical ? this.fieldWidth : this.fieldHeight
        let x = (width / 2 - boardsWidth) * isRight
        let y = -height / 2 + boardsWidth + holeEntranceRadius * 1.414 + bevelSize / 2
        shape.moveTo(isVertical ? y : x, isVertical ? x : y)
        x = (width / 2 - boardsWidth - holeEntranceRadius - bevelSize) * isRight
        y = -height / 2 + boardsWidth + holeEntranceRadius * 2.414 + bevelSize / 2
        shape.lineTo(isVertical ? y : x, isVertical ? x : y)
        shape.lineTo(isVertical ? -y : x, isVertical ? x : -y)
        x = (width / 2 - boardsWidth) * isRight
        y = height / 2 - boardsWidth - holeEntranceRadius * 1.414 - bevelSize / 2
        shape.lineTo(isVertical ? y : x, isVertical ? x : y)
        return this.createInsideBoard(shape, bevelSize)
    }

    createInsideBoard(shape, bevelSize) {
        let texture = this.textures.fieldTexture.clone()
        texture.needsUpdate = true
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(0.25, this.fieldWidth / this.boardsWidth / 150)
        const geometry = new THREE.ExtrudeGeometry(shape, {
            steps: 1,
            depth: this.ballSize - bevelSize - 0.0000001,
            bevelEnabled: true,
            bevelSize: bevelSize,
            bevelThickness: bevelSize,
            bevelSegments: 2
        });
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 1,
            metalness: 0.3
        });
        const insideBoard = new THREE.Mesh(geometry, material)
        insideBoard.castShadow = true;
        insideBoard.receiveShadow = true;
        return insideBoard
    }

    generateBalls() {
        const loader = new THREE.TextureLoader()
        loader.setCrossOrigin('anonymous')
        let ballsLoadedCounter = 0
        for (let i = 1; i <= 15; i++) {
            loader.load(`img/ball${i}.png`,
                texture => {
                    increaseLoadedObjects();
                    let position = this.getNextBallPosition(ballsLoadedCounter + 1)
                    this.balls.push(
                        new Ball(
                            this.scene,
                            texture,
                            this.reflectionsMap.texture,
                            position.x,
                            position.y,
                            i
                        ))
                    if (++ballsLoadedCounter === 15) {
                        this.loadLastBall(loader)
                    }
                })
        }
    }

    getNextBallPosition(i) {
        let row = 5
        if (i < 11) row--
        if (i < 7) row--
        if (i < 4) row--
        if (i < 2) row--
        let indexInRow = i
        for (let j = 1; j < row; j++) {
            indexInRow -= j
        }
        if (this.fieldWidth > this.fieldHeight) {
            return {
                x: -this.fieldWidth / 8 - this.ballSize * 1.85 * (row - 1),
                y: (indexInRow - 1) * this.ballSize * 2.08 - this.ballSize * 1.04 * (row - 1)
            }
        } else {
            return {
                y: this.fieldHeight / 8 + this.ballSize * 1.85 * (row - 1),
                x: (indexInRow - 1) * this.ballSize * 2.08 - this.ballSize * 1.04 * (row - 1)
            }
        }
    }

    loadLastBall(loader) {
        loader.load('img/main.png',
            texture => {
                increaseLoadedObjects()
                this.mainBall = new Ball(
                    this.scene,
                    texture,
                    this.reflectionsMap.texture,
                    this.fieldWidth > this.fieldHeight ? (this.fieldWidth / 8 * 3) : 0,
                    this.fieldWidth <= this.fieldHeight ? -(this.fieldHeight / 8 * 3) : 0,
                    0
                )
                this.balls.push(this.mainBall)
                this.render()
                startGame()
            })
    }

    render(iterations = 4) {
        this.renderer.render(this.scene, this.camera)
        //this.reflectionCamera.update(this.renderer, this.scene)
        for (let i = 0; i < iterations; i++) {
            this.moveBalls()
        }
        requestAnimationFrame(window.render)
    }

    moveBalls() {
        for (let i = 0; i < this.balls.length; i++) {
            if (this.balls[i].isActive) {
                this.balls[i].move()
                for (let j = i + 1; j < this.balls.length; j++) {
                    if (subtract(this.balls[i].mesh.position, this.balls[j].mesh.position)
                        .length() <= this.ballSize * 2
                    ) {
                        this.balls[i].resolveCollision(this.balls[j])
                    }
                }
            }
        }
    }
}

const progressElement = document.getElementById('progress')
const totalObjects = 20
let loadedObjects = 0

function increaseLoadedObjects() {
    loadedObjects++;
    progressElement.innerHTML = Math.round(loadedObjects / totalObjects * 100) + '%';
}

window.game = new Game(
    25, // field size
    0.35, // ball size
    0.8, // boardsWidth
    50, // camera view width in degrees
    false, // is perspective camera
)
window.render = function () {
    game.render()
}


function handleClick(x, y) {
    const fieldX = (x - window.innerWidth / 2) / window.innerWidth * game.fieldWidth
    const fieldY = -(y - window.innerHeight / 2) / window.innerHeight * game.fieldHeight
    if (game.mainBallLoosed) {
        game.mainBall.mesh.position.x = fieldX;
        game.mainBall.mesh.position.y = fieldY;
        game.scene.add(game.mainBall.mesh);
        game.mainBallLoosed = false;
        game.mainBall.isActive = true;
    } else {
        game.mainBall.moveTo(fieldX, fieldY)
    }
}

window.startGame = function () {
    setTimeout(() => {
        document.getElementById('field').style.cssText = 'opacity: 1'
    }, 3000)
    setTimeout(() => {
        document.getElementById('overlay').style.cssText = 'opacity: 0'
    }, 2000)
    setTimeout(() => {
        document.getElementById('overlay').remove()
        document.addEventListener('click', function (event) {
            handleClick(event.clientX, event.clientY)
        })
    }, 3200)
}
