import {tryCatch} from "./../utils/tryCatch.js"

const registerUser=tryCatch(
    async (req,res)=> {res.status(200).json({message:"ok"});}
)

export {registerUser};