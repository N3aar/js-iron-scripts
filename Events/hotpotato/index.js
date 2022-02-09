import { Command, wait } from '../../utils'

// Configuration
const config = {
	modRank: 8,
	defaultWins: 2,
	seconds: 30,
	fire: 25,
	freeze: 12
}

const messages = {
	potato: 'A batata está com você agora, passe para alguém antes que se queime!',
	help: [
		':iniciar - Inicia o jogo; :resetar - Reinicia o jogo para uma nova partida.', 
		':pausar - pausa o jogo; :retornar - inicia novamente caso tenha pausado.',
		':wins <quantidade> - Quantidade de vencedores; :fogo - Adiciona o fogo novamente.]'
	],
}

const bases = {
	door: 1575,
	points: 719035,
	tileDoor: 717044,
	freezer: 1224,
	numbers: 713085
}

const getAround = ({ x, y }) => [
	{ x, y: y - 1 },
	{ x: x + 1, y },
	{ x, y: y + 1 },
	{ x: x - 1, y }
]

// Game Memory
const game = {
	door: null,
	potato: null,
	users: new Map(),
	freezes: new Map(),
	wins: config.defaultWins,
	time: null,
	paused: false,
	tileDoor: Room.getAllFurnisBySpriteId(bases.tileDoor),
	points: Room.getAllFurnisBySpriteId(bases.points),
	numbers: {
		left: null,
		right: null
	}
}

// Utils
const cancelTime = () => {
	if (game.time) {
		Delay.cancel(game.time)
		game.time = null
	}
}

const setDoors = (furnis, action) => {
	const state = Number(action === 'open')
	const multi = Array.isArray(furnis)

	if (multi) {
		furnis.forEach(furni => furni.setState(state))
	} else {
		furnis.setState(state)
	}
}

const setPlayerWalk = (entity, can) => {
	entity.cancelWalk()
	entity.setCanWalk(can, !can)
	entity.removeEffect()
}

const checkEnoughPlayers = () => {
	return game.users.size > game.wins
}

const toRandomTile = entity => {
	const points = game.points
	const random = Math.floor(Math.random() * points.length)
	const tile = points[random]
	const x = tile.getX()
	const y = tile.getY()

	entity.teleport(x, y, 0, 2)
}

const removeFreezeAll = () => {
	game.users.forEach((_, id) => removeFreeze(id))

	const users = Room.getAllPlayers()
	users.setCanWalk(true, false)
}

const removeUser = id => {
	game.users.delete(id)
}

// Start
const potatoToRandom = () => {
	const users = [...game.users.values()]
	const random = Math.floor(Math.random() * users.length)
	const user = users[random]
	const id = user.getId()

	removeFreeze(id)
	user.setEffect(config.fire)

	game.potato = id
}

const kickPotato = () => {
	const potatoId = game.potato
	const potato = potatoId && game.users.get(potatoId)

	if (potato) {
		potato.kick()
	}

	removeUser(potatoId)
	game.potato = null

	if (checkEnoughPlayers()) {
		setDoors(game.tileDoor, 'open')
		potatoToRandom()
	}
}

const start = entity => {
	const size = game.users.size

	if (size < 2) {
		return
	}

	const door = game.door.furni

	setDoors(door, 'close')
	setDoors(game.tileDoor, 'open')

	const ticks = (size >= 40) ? 20 : ((size >= 25) ? 25 : 30)
	const seconds = Delay.seconds(ticks)

	game.time = Delay.interval(kickPotato, seconds)
	game.seconds = seconds

	potatoToRandom()

	entity.message('Partida iniciando!')
}

// Pause
const pause = () => {
	cancelTime()

	const freezeAll = (user, id) => {
		removeFreeze(id)
		setPlayerWalk(user, false)
	}

	game.users.forEach(freezeAll)
}

// Resume
const restart = () => {
	if (!checkEnoughPlayers()) {
		return
	}

	cancelTime()
	removeFreezeAll()
	potatoToRandom()

	const potatoId = game.potato
	const potato = potatoId && game.users.get(potatoId)

	if (potato) {
		potato.setEffect(config.fire)
		potato.setCanWalk(true, false)
	}

	game.time = Delay.interval(kickPotato, game.seconds)
	game.paused = false

	setDoors(game.tileDoor, 'open')
}

// Reset
const reset = () => {
	cancelTime()

	const numbers = game.numbers

	numbers.left.setState(0)
	numbers.right.setState(0)

	removeFreezeAll()

	game.paused = false
	game.potato = null

	const door = game.door.furni

	setDoors(door, 'open')
	setDoors(game.tileDoor, 'open')
}

// Wins
const setWins = (entity, message) => {
	const arg = message.split(' ')[1]
	const wins = Number(arg)

	if (!wins) {
		return entity.message('Digite os quantidade de ganhadores corretamente!')
	}

	game.wins = wins

	entity.message(`${wins} ganhador(es)!`)
}

// Check Fire Effect
const checkFire = () => {
	const id = game.potato
	const potato = id && game.users.get(id)

	if (potato) {
		potato.setEffect(config.fire)		
	}
}

// List Commands
const listCommands = entity => {
	entity.message(messages.help)
}

// Load
const getDoor = () => {
	const doors = Room.getAllFurnisBySpriteId(bases.door)
	const furni = doors[0]
	const id = furni.getId()
	game.door = { id, furni }
}

const getNumbers = () => {
	const furnis = Room.getAllFurnisBySpriteId(bases.numbers)
	const order = furnis.sort((numA, numB) => numA.getX() - numB.getX())

	game.numbers.left = order[0]
	game.numbers.right = order[1]
}

const initialize = () => {
	getDoor()
	getNumbers()
	setDoors(game.tileDoor, 'open')
}

// Update Timer
const updateSeconds = () => {
	if (!game.time) {
		return
	}

	if (!checkEnoughPlayers) {
		return pause()
	}

	const seconds = game.time.getTicksRemain() * 0.5
	const left = Math.floor(seconds / 10)
	const right = Math.floor(seconds % 10)
	const numbers = game.numbers

	numbers.right.setState(right)
	numbers.left.setState(left)

	if (seconds <= 3) {
		setDoors(game.tileDoor, 'close')
	}
}

// Join
const entry = (entity, furni) => {
	if (game.time) {
		return
	}

	const furniId = furni.getId()

	if (furniId === game.door.id) {
		game.users.set(entity.getId(), entity)
		toRandomTile(entity)
	}
}

// Touching
const newPotato = id => {
	const potatoId = game.potato
	const potato = potatoId && game.users.get(potatoId)

	if (potato) {
		potato.removeEffect()
	}

	game.potato = id

	const user = game.users.get(id)
	
	removeFreeze(id)

	user.message(messages.potato)
	user.setEffect(config.fire)

	wait(checkFire, Delay.seconds(1))
}

const getEntitesClose = () => {
	const id = game.potato
	const user = game.users.get(id)
	const x = user.getX()
	const y = user.getY()
	const around = getAround({ x, y })
	return around
		.map(coord => Room.getEntitiesByCoord(coord.x, coord.y))
		.filter(ents => ents && ents.length)
}

const touching = entity => {
	const id = entity.getId()

	if (id === game.potato) {
		const close = getEntitesClose()
		const entities = close[0]
		const target = entities && entities[0] 

		if (target) {
			const targetId = target.getId()
			newPotato(targetId)
		}
	}
}

// Freeze
const removeFreeze = id => {
	const freeze = game.freezes.get(id)
	const user = game.users.get(id)

	if (freeze) {
		Delay.cancel(freeze)
		game.freezes.delete(id)
	}

	if (user) {
		setPlayerWalk(user, true)
	}
}

const freeze = entity => {
	setPlayerWalk(entity, false)
	entity.setEffect(config.freeze)

	const remove = () => {
		game.freezes.delete(id)
		removeFreeze(entity.getId())
	}

	const delay = wait(remove, Delay.seconds(1))
	const id = entity.getId()

	game.freezes.set(id, delay)
}

const tileFreeze = (entity, furni) => {
	const id = entity.getId()

	if (!game.time || game.potato === id) {
		return
	}

	const sprite = furni.getSprite()
	if (sprite === bases.freezer) {
		freeze(entity)
	}
}

// Leave
const leave = id => {
	if (!checkEnoughPlayers()) {
		return pause()
	}

	if (game.potato === id) {
		restart()
	} else {
		removeUser(id)
		removeFreeze(id)
	}
}

// Commands
const rank = config.modRank

Command(':iniciar', true, rank, start)
Command(':pause', true, rank, pause)
Command(':retornar', true, rank, restart)
Command(':resetar', true, rank, reset)
Command(':wins', true, rank, setWins)
Command(':fogo', true, rank, checkFire)
Command(':lista', true, rank, listCommands)

// Events
Events.on('load', initialize)
Events.on('tick', updateSeconds)
Events.on('stepOn', entry)
Events.on('stepOn', touching)
Events.on('stepOn', tileFreeze)
Events.on('userLeave', leave)
