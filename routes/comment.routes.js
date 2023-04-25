const Router = require('express')
const { validationResult } = require('express-validator')
const router = new Router()
const Comment = require('../models/Comment')

// comments routes

router.post(
	'/comment',

	async (req, res) => {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return res
					.status(400)
					.json({ message: 'Uncorrect request', errors })
			}
			const { postId, comment, author } = req.body

			const newComment = new Comment({ postId, comment, author })
			newComment.save()
				.then(() => res.json({ message: 'Message sent', newComment: newComment }))
				.catch((err) => console.log(err))
		} catch (e) {
			console.log(e)
			res.send({ message: 'Server error' })
		}
	}
)

router.get('/allcomments', async (req, res) => {
	try {
		const comment = await Comment.find({})
		return res.json(comment)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

router.get(`/getcommentsfrom/:postId`, async (req, res) => {
	try {
		const post = await Comment.find({ postId: req.params.postId })
		return res.json(post)
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

module.exports = router
