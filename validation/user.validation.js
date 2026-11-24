const joi = require('joi')

const updateProfileSchema = joi.object({
    username : joi.string().min(3).max(30),
    phone : joi.string().pattern(/^[0-9+]+$/),
    avatar : joi.string().uri(),
}).min(1).messages({
    'object.min' : 'Request body can not be empty'
})

const changePasswordSchema = joi.object({
    currentPassword : joi.string().required(),
    newPassword : joi.string().min(8).required(),
})

module.exports = {
    updateProfileSchema,
    changePasswordSchema
}