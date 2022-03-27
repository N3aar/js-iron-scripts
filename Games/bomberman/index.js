import { wait } from '../../Util/utils'
import maps from './maps'

// Configuration
const config = {
	chanceItem: 40,
	addRedBombs: 2,
	door: 306233462,
	default: {
		bomb: {
			radius: 1,
			type: 'default',
			red: 0,
			simult: 1,
			used: 0
		},
		shield: null
	},
	shield: {
		time: 15,
		effect: 328
	},
	bomb: {
		delay: 3,
		max_radius: 8
	},
	initial: {
		x: 12,
		y: 2
	},
	final: {
		x: 22,
		y: 14
	},
	block_zone: {
		x: 33,
		y: 3
	},
	barrier_zone: {
		x: 34,
		y: 3
	}
}

const bases = {
	bomb: 722822,
	red: 722820,
	explosion: 722479,
	breakable: 5357,
	unbreakable: 5371,
	barrier: 716132,
	shield: 722826,
	bomb_inc: 722819,
	bomb_dec: 722818,
	red_bomb: 722821,
	fire_inc: 722825,
	fire_dec: 722824,
	fire_max: 722823
}

const states = {
	enable: 2,
	disable: 1,
	time: 2
}

const types = {
	b: 'breakable',
	u: 'unbreakable'
}

const displayShieldTime = ({ player }) => `Tempo: ${player.shield.getTicksRemain() / 2}s`
const displayRedBombs = ({ player }) => `Bombas Vermelhas: ${player.bomb.red}`
const displayBombRadius = ({ player }) => `Raio da Bomba: ${player.bomb.radius}`
const displayBombs = ({ player }) => `Bombas: ${player.bomb.simult}`

const powerup_display = {
	shield: displayShieldTime,
	red_bomb: displayRedBombs,
	fire_max: displayBombRadius,
	fire_inc: displayBombRadius,
	fire_dec: displayBombRadius,
	bomb_inc: displayBombs,
	bomb_dec: displayBombs
}

const names = {
	shield: 'Escudo',
	bomb_inc: 'Bomba Aumentada',
	bomb_dec: 'Bomba Diminuida',
	red_bomb: 'Bomba Vermelha',
	fire_inc: 'Fogo Aumentado',
	fire_dec: 'Fogo Diminuido',
	fire_max: 'Fogo Máximo'
}

const powerups = ['shield', 'red_bomb', 'bomb_inc', 'bomb_dec', 'fire_inc', 'fire_dec', 'fire_max']

const powerup_chances = {
	fire_dec: 15,
	fire_inc: 25,
	bomb_dec: 15,
	bomb_inc: 20,
	fire_max: 5,
	red_bomb: 5,
	shield: 15
}

const powerup_porcentage = powerups.reduce((acc, curr) => acc + powerup_chances[curr], 0)

// Game Memory
const game = {
	start: false,
	players: {},
	map: {},
	furnis: {
		barrier: null,
		breakable: null,
		unbreakable: null
	},
	players_spawn: [],
	positioned_bombs: []
}

// Utils
const increments = [
	coord => coord.y--,
	coord => coord.x++,
	coord => coord.y++,
	coord => coord.x-- 
]

const setInMap = (position, key, value) => {
	const { x, y } = position	

	if (!(x in game.map)) {
		game.map[x] = {}
	}

	if (!(y in game.map[x])) {
		game.map[x][y] = {}
	}

	game.map[x][y][key] = value
}

const getTileInMap = (x, y) => {
	const cx = game.map[x]

	if (!cx) {
		return
	}

	return cx[y]
}

const removeInMap = (x, y, key) => {
	const cx = game.map[x]
	const cy = cx && cx[y]

	if (!cy) {
		return
	}

	if (key) {
		delete cy[key]
	} else {
		delete cx[y]
	}
}

const hasBombInPosition = (x, y) => {
	return game.positioned_bombs.some(bmb => bmb.x === x && bmb.y === y)
}

const removeBombInList = (x, y) => {
	const index = game.positioned_bombs.findIndex(bmb => bmb.x === x && bmb.y === y)
	game.positioned_bombs.splice(index, 1)
}

const removeRedBomb = player => {
	if (player.bomb.red) {
		player.bomb.red--
	}

	if (!player.bomb.red) {
		player.bomb.type = 'default'
	}

	return player
}

const getBarrier = () => {
	const furnis = game.furnis.barrier
	const barrier = furnis.shift()
	return barrier
}

const removeBarrier = (x, y) => {
	const furnis = Room.getFurniByTile(x, y)
	const barrier = furnis.find(fn => fn.getSprite() === bases.barrier)

	if (!barrier) {
		return
	}

	game.furnis.barrier.push(barrier)

	barrier.move(config.barrier_zone.x, config.barrier_zone.y, 0, 0)
}

const copyObject = object => Object.assign({}, object)

const random = (max, min = 0) => Math.floor(Math.random() * (max - min + 1)) + min

const removeBlock = furni => furni.move(config.block_zone.x, config.block_zone.y, 0,0)

const hasEntity = (x, y) => !!Room.getEntitiesByCoord(x, y)?.length

// Game
const getTiles = (bomb, position) => {
	const x = position.x
	const y = position.y

	const first = getTileInMap(x, y)
	const coords = Array.from({ length: 4 }, () => ({ x, y }))

	if (!first) {
		return
	}

	const tiles = [first]

	for (let i = 0; i < bomb.radius; i++) {
		for (const index in increments) {
			if (coords.every(cd => cd.wall)) {
				return tiles
			}

			const coord = coords[index]
			if (coord.wall) {
				continue
			}

			increments[index](coord)

			const tile = getTileInMap(coord.x, coord.y)

			if (!tile) {
				continue
			}

			if (tile.block) {
				const isUnbreakable = tile.block.type === 'unbreakable'

				if (bomb.type !== 'red' || isUnbreakable) {
					coord.wall = true
				}

				if (!isUnbreakable) {
					tiles.push(tile)
				}
			} else {
				tiles.push(tile)
			}
		}
	}

	return tiles
}

const randomItemByChance = () => {
	const rdn = random(powerup_porcentage, 1)
	let acc = 0

	for (const powerup of powerups) {
		const chance = powerup_chances[powerup]
		const value = acc + chance

		if (rdn > acc && rdn <= value) {
			return powerup
		}

		acc += chance
	}
}

const randomChanceItem = (x, y) => {
	const chance = random(100, 1)

	if (chance > config.chanceItem) {
		return
	}

	const powerup = randomItemByChance()
	const base = bases[powerup]
	const furni =  Faker.createFakeItem(base, x, y, 0, 0)

	const item = {
		type: powerup,
		furni
	}

	setInMap({ x, y }, 'powerup', item)
}

const playerLose = player => {
	player.teleport(13, 18, 0, 4)
	Engine.d(`${player.getUsername()} Perdeu!`)
}

const removeBombUsed = player => {
	if (player.bomb.used) {
		player.bomb.used--
	}
}

const resetExplosions = furnis => {
	for (const furni of furnis) {
		if (!furni) {
			continue
		}

		furni.uses--

		if (!furni.uses) {
			furni.animation.setState(states.disable)
		}
	}
}

const explosion = (furnis, player) => {
	for (const furni of furnis) {
		if (!furni) {
			return
		}

		furni.uses++
		furni.animation.setState(states.enable)

		const block = furni.block
		const x = furni.animation.getX()
		const y = furni.animation.getY()

		if (block && block.type === 'breakable') {
			removeBlock(block.furni)
			removeInMap(x, y, 'block')
			randomChanceItem(x, y)
		}

		const entities = Room.getEntitiesByCoord(x, y)

		if (entities.length) {
			for (const entity of entities) {
				const id = entity.getId()
				const player = game.players[id]

				if (!player) {
					continue
				}

				const shield = player.shield
				if (!shield) {
					playerLose(entity)
				}
			}
		}
	}

	removeBombUsed(player)

	wait(() => resetExplosions(furnis), states.time)
}

const createBomb = entity => {
	if (!game.start) {
		return
	}

	const id = entity.getId()
	const player = game.players[id]

	if (!player) {
		return
	}

	const bomb = player.bomb
	const simultaneous = bomb.simult
	const used = bomb.used

	if (used >= simultaneous) {
		return
	}

	const x = entity.getX()
	const y = entity.getY()
	const hasBomb = hasBombInPosition(x, y)

	if (hasBomb) {
		return
	}

	const position = { x, y }
	const tiles = getTiles(bomb, position)

	if (!tiles?.length) {
		return
	}

	const isRed = bomb.type === 'red' && bomb.red

	if (isRed) {
		removeRedBomb(player)	
	}

	const base = isRed ? bases.red : bases.bomb
	const furni = Faker.createFakeItem(base, x, y, 0, 0)
	const delay = Delay.seconds(config.bomb.delay)

	game.positioned_bombs.push({ x, y })

	player.bomb.used++

	const powder = () => {
		Faker.removeFakeFloorItem(furni)
		removeBombInList(x, y)
		removeBarrier(x, y)
		explosion(tiles, player)
	}

	wait(powder, delay)
}

const checkBombsPositioned = () => {
	for (const bomb of game.positioned_bombs) {
		const x = bomb.x
		const y = bomb.y

		const furnis = Room.getFurniByTile(x, y)
		const hasBarrier = furnis.some(fn => fn.getSprite() === bases.barrier)

		if (hasBarrier) {
			removeBombInList(x, y)
			continue
		}

		const entities = Room.getEntitiesByCoord(x, y)

		if (entities.length) {
			continue
		}

		const barrier = getBarrier()

		barrier.move(x, y, 0.3, 0)
	}
}

const addPlayer = entity => {
	const id = entity.getId()
	const bomb = copyObject(config.default.bomb)
	const shield = config.default.shield

	const data = {
		id,
		entity,
		bomb,
		shield
	}

	game.players[id] = data
}

const start = () => {
	game.start = true

	for (const id in game.players) {
		const player = game.players[id] 
		player?.entity?.setCanWalk(true, false)
	}
}

const door = (entity, furni) => {
	const furniId = furni.getId()

	if (config.door !== furniId || game.start) {
		return
	}

	const positions = game.players_spawn
	const tile = positions.find(coord => !hasEntity(coord.x, coord.y))

	if (!tile) {
		return
	}

	entity.setCanWalk(false, false)
	entity.teleport(tile.x, tile.y, 0, 2)

	addPlayer(entity)

	const allPlayers = positions.every(coord => hasEntity(coord.x, coord.y))

	if (allPlayers) {
		start()
	}
}

const createExplosionFurnis = () => {
	const initX = config.initial.x
	const initY = config.initial.y

	const finX = config.final.x
	const finY = config.final.y

	for (let x = initX; x <= finX; x++) {
		for (let y = initY; y <= finY; y++) {
			const position = { x, y }
			const key = 'animation'
			const furni = Faker.createFakeItem(bases.explosion, x, y, 0, 0)

			furni.setState(states.disable)

			setInMap(position, 'uses', 0)
			setInMap(position, key, furni)
		}
	}
}

const setBlocks = () => {
	const keys = Object.keys(game.furnis)
	for (const key of keys) {
		game.furnis[key] = [...Room.getAllFurnisBySpriteId(bases[key])]
	}
}

const placeBlocksByMap = () => {
	setBlocks()
	
	const random = Math.floor(Math.random() * maps.length)
	const map = maps[random]
	
	for (const l in map) {
		const line = map[l]?.reverse()
		
		for (const c in line) {
			const block = line[c]
			const type = types[block]
			const playerPosition = Number(block)
 
			if (!type && !playerPosition) {
				continue
			}

			const { initial } = config
			const x = initial.x + Number(l)
			const y = initial.y + Number(c)

			if (playerPosition) {
				const index = playerPosition - 1
				game.players_spawn[index] = { x, y }
				continue
			}

			const list = game.furnis[type]
			const furni = list?.pop()

			const position = { x, y }
			const tile = { type, furni }

			furni.move(x, y, 0, 0)

			setInMap(position, 'block', tile)
		}
	}
}

const viewStats = entity => {
	const id = entity.getId()
	const data = game.players[id]

	if (!data) {
		return
	}

	const bomb = data.bomb
	const text = `Bombas: ${bomb.uses} / Raio: ${bomb.radius} / Tipo: ${bomb.type}` 

	entity.message(text)
}

// Powerups
const removePlayerShield = (entity, forced) => {
	const id = entity.getId()
	const player = game.players[id]
	const shield = player.shield

	if (forced && shield) {
		Delay.cancel(shield)
	}

	player.shield = null

	entity.removeEffect()
}

const addPlayerShield = ({ entity }) => {
	const id = entity.getId()
	const player = game.players[id]

	if (player.shield) {
		return
	}

	const time = config.shield.time
	const delay = wait(() => removePlayerShield(entity), Delay.seconds(time))

	player.shield = delay

	entity.setEffect(config.shield.effect)
}

const fire_max = ({ player }) => player.bomb.radius = config.bomb.max_radius

const bomb_inc = ({ player }) => player.bomb.simult++

const red_bomb = ({ player }) => {
	player.bomb.type = 'red'
	player.bomb.red += config.addRedBombs
}

const bomb_dec = ({ player }) => {
	if (player.bomb.simult > 1) {
		player.bomb.simult--
	}
}

const fire_inc = ({ player }) => {
	if (player.bomb.radius < config.bomb.max_radius) {
		player.bomb.radius++
	}
}

const fire_dec = ({ player }) => {
	if (player.bomb.radius > 1) {
		player.bomb.radius--
	}
}

const powerup_actions = {
	shield: addPlayerShield,
	fire_max,
	red_bomb,
	bomb_inc,
	bomb_dec,
	fire_inc,
	fire_dec
}

const checkPowerup = entity => {
	const id = entity.getId()
	const player = game.players[id]

	if (!player) {
		return
	}

	const x = entity.getX()
	const y = entity.getY()
	const tile = getTileInMap(x, y)

	if (!tile || !tile.powerup) {
		return
	}

	Faker.removeFakeFloorItem(tile.powerup.furni)

	const type = tile.powerup.type
	const action = powerup_actions[type]

	if (!action) {
		return
	}

	delete tile.powerup

	action({ entity, player })

	const name = names[type]
	const display = powerup_display[type]
	const info = display && display({ entity, player })

	const powerup = `Você ativou ${name}!`
	const text = info && powerup + '\n' + info

	entity.notification('generic', text || powerup)
}

// Events
Events.on('interact', createBomb)
Events.on('tick', checkBombsPositioned)
Events.on('stepOn', door)
Events.on('stepOn', checkPowerup)
Events.on('load', createExplosionFurnis)
Events.on('load', placeBlocksByMap)

// Commands
Commands.register(':s', true, viewStats)
Commands.register(':b', true, createBomb)

// Temp
Commands.register(':clear', () => {
	setBlocks()
	game.furnis.breakable.forEach(removeBlock)
	//game.furnis.unbreakable.forEach(removeBlock)
})
