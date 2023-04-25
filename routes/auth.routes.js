const Router = require('express')
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const { check, validationResult } = require('express-validator')
const router = new Router()
const authMiddleware = require('../middleware/auth.middleware')

router.post(
	'/registration',
	[
		check('email', 'Uncorrect email').isEmail(),
		check(
			'password',
			'Password must be longer than 3 and shorter than 12'
		).isLength({ min: 3, max: 12 }),
	],
	async (req, res) => {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return res
					.status(400)
					.json({ message: 'Incorrect request', errors })
			}
			const { email, password, number, name } = req.body
			const candidate = await User.findOne({ email })
			if (candidate) {
				return res
					.status(400)
					.json({ message: `User with email ${email} already exist` })
			}
			const hashPassword = await bcrypt.hash(password, 8)
			let currentDate = new Date().toJSON().slice(0, 10)

			const user = new User({
				email,
				password: hashPassword,
				date: currentDate,
				number,
				name,
				status: 'active',
				role: 'user',
			})
			await user.save()
			res.json({ message: 'User was created' })
		} catch (e) {
			console.log(e)
			res.send({ message: 'Server error' })
		}
	}
)

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body
		const user = await User.findOne({ email })
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}
		// compares encrypted pass with default
		const isPassValid = bcrypt.compareSync(password, user.password)
		if (!isPassValid) {
			return res.status(400).json({ message: 'Invalid password' })
		}
		const token = jwt.sign({ id: user.id }, config.get('secretKey'), {
			expiresIn: '1h',
		})
		return res.json({
			token,
			user: {
				id: user.id,
				email: user.email,
				date: user.date,
				status: user.status,
				role: user.role,
			},
		})
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get('/auth', authMiddleware, async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.user.id })
		const token = jwt.sign({ id: user.id }, config.get('secretKey'), {
			expiresIn: '1h',
		})
		return res.json({
			token,
			user: {
				id: user.id,
				email: user.email,
				date: user.date,
				status: user.status,
			},
		})
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get('/allusers', async (req, res) => {
	try {
		const user = await User.find({}, { password: 0 })
		return res.json(user)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.delete(`/delete/:id`, async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.params.id })
		user.delete()
		return res.status(204).json({})
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.patch(`/user/:id`, async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.params.id })
		user.status = user.status == 'active' ? 'blocked' : 'active'
		user.save()
			.then(() => res.json({ message: 'Message sent', user: user }))
			.catch((err) => console.log(err))
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.patch(`/userrole/:id`, async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.params.id })
		user.role = user.role == 'user' ? 'admin' : 'user'
		user.save()
			.then(() => res.json({ message: 'Message sent', user: user }))
			.catch((err) => console.log(err))
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get(`/getoneuser/:email`, async (req, res) => {
	try {
		const user = await User.findOne({ email: req.params.email })
		return res.json(user)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

module.exports = router
