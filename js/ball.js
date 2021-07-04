class Ball {

    static fieldHeight
    static fieldWidth
    static boardSize
    static size
    static init(height, width, size, boardSize) {
        Ball.fieldHeight = height
        Ball.fieldWidth = width
        Ball.boardSize = boardSize
        Ball.size = size
    }

    mesh
    number
    speed
    isActive = true;

    constructor(scene, texture, reflectionView, x, y ,number) {
        this.number = number
        this.speed = new THREE.Vector2(0, 0)
        const geometry = new THREE.SphereGeometry(Ball.size, 20, 20)
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            envMap: reflectionView,
            roughness: 0,
            metalness: 0.35,
            fog: true,
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.set(x, y, Ball.size)
        this.mesh.castShadow = true
        this.mesh.rotation.x += Math.random()*22
        this.mesh.rotation.y += Math.random()*22
        this.mesh.rotation.z += Math.random()*22
        scene.add(this.mesh)
    }

    move() {
        if (this.touchesHole()) {
            this.remove()
            return
        }
        if(this.speed.length() < 0.0001) {
            this.speed.multiplyScalar(0)
            return
        }
        this.mesh.position.x += this.speed.x
        this.mesh.position.y += this.speed.y
        let rotationAxis = new THREE.Vector3(-this.speed.y, this.speed.x, 0).normalize()
        this.mesh.rotateOnWorldAxis(rotationAxis, this.speed.length()/Ball.size)
        this.speed = this.speed.multiplyScalar(0.9955)
        const distanceToEnd = Ball.size + Ball.boardSize
        if(this.mesh.position.x >= Ball.fieldWidth/2 - distanceToEnd) {
            this.speed.x = - this.speed.x
            this.speed.multiplyScalar(0.99)
            this.mesh.position.x = Ball.fieldWidth/2 - distanceToEnd - 0.01
        } else if(this.mesh.position.x <= - Ball.fieldWidth/2 + distanceToEnd) {
            this.speed.x = - this.speed.x
            this.speed.multiplyScalar(0.99)
            this.mesh.position.x = - Ball.fieldWidth/2 + distanceToEnd + 0.01
        }
        if(this.mesh.position.y >= Ball.fieldHeight/2 - distanceToEnd) {
            this.speed.y = - this.speed.y
            this.speed.multiplyScalar(0.99)
            this.mesh.position.y = Ball.fieldHeight/2 - distanceToEnd - 0.01
        } else if(this.mesh.position.y <= - Ball.fieldHeight/2 + distanceToEnd) {
            this.speed.y = - this.speed.y
            this.speed.multiplyScalar(0.99)
            this.mesh.position.y = - Ball.fieldHeight/2 + distanceToEnd + 0.01
        }
    }

    remove() {
        this.isActive = false;
        this.speed.multiplyScalar(0)
        window.game.scene.remove(this.mesh);
        if (this.number === 0) {
            window.game.mainBallLoosed = true;
        }
    }

    touchesHole() {
        return this.touchesConnerHole() || this.touchesSideHole();
    }

    touchesConnerHole() {
        return (
            (this.mesh.position.x >= -Ball.fieldWidth/2 + Ball.size + Ball.boardSize &&
                this.mesh.position.x <= -Ball.fieldWidth/2 + Ball.size * 1.5 + Ball.boardSize) ||
            (this.mesh.position.x <= Ball.fieldWidth/2 - Ball.size - Ball.boardSize &&
                this.mesh.position.x >= Ball.fieldWidth/2 - Ball.size * 1.5 - Ball.boardSize)
        ) && (
            (this.mesh.position.y >= -Ball.fieldHeight/2 + Ball.size + Ball.boardSize &&
                this.mesh.position.y <= -Ball.fieldHeight/2 + Ball.size * 1.5 + Ball.boardSize) ||
            (this.mesh.position.y <= Ball.fieldHeight/2 - Ball.size - Ball.boardSize &&
                    this.mesh.position.y >= Ball.fieldHeight/2 - Ball.size * 1.5 - Ball.boardSize)
        )
    }

    touchesSideHole() {
        const restriction = ((window.innerWidth > window.innerHeight) ?
            Ball.fieldHeight / 2.002 : Ball.fieldWidth / 2.002) - Ball.boardSize - Ball.size;
        const restrictParam = (window.innerWidth > window.innerHeight) ?
            this.mesh.position.y : this.mesh.position.x;
        const freeParam = (window.innerWidth > window.innerHeight) ?
            this.mesh.position.x : this.mesh.position.y;

        return (restrictParam >= restriction || restrictParam <= -restriction) &&
                freeParam <= Ball.size * 0.65 && freeParam >= -Ball.size * 0.65;
    }

    resolveCollision(ball) {
        let deltaPosition = subtract(ball.mesh.position, this.mesh.position)
        let deltaPositionInverse = subtract(this.mesh.position, ball.mesh.position)
        let deltaSpeed = subtract(ball.speed, this.speed)
        let deltaSpeedInverse = subtract(this.speed, ball.speed)
        let distance = deltaPosition.length();

        if(distance < Ball.size * 1.9) {
            ball.mesh.position.x = this.mesh.position.x + deltaPosition.x / distance * Ball.size*2.0000001
            ball.mesh.position.y = this.mesh.position.y + deltaPosition.y / distance * Ball.size*2.0000001
        }

        ball.speed.sub(
            deltaPosition.multiplyScalar(deltaSpeed.dot(deltaPosition) / distance / distance)
        ).multiplyScalar(0.99)
        this.speed.sub(
            deltaPositionInverse.multiplyScalar(deltaSpeedInverse.dot(deltaPositionInverse) / distance / distance)
        ).multiplyScalar(0.99)

    }

    // angle in radians
    applyPower(powerX, powerY) {
        this.speed.x += powerX
        this.speed.y += powerY
    }

    moveTo(x, y) {
        this.applyPower(
            (x - this.mesh.position.x)/100,
            (y - this.mesh.position.y)/100
        )
    }
}

function subtract(b, a){
    return new THREE.Vector2(b.x - a.x, b.y - a.y)
}
