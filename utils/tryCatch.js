const tryCatch=(fn)=>(req,res,next)=>{
    Promise.resolve(fn(req,res,next)).catch((error)=>{
        res.status(error.code ||500).json({
            success:false,
            message:error.message
        })
    })
}









// const tryCatch=(fn)=>async (req,res,next)=>{
//     try{
//         await fn(req,res,next);
//     }
//     catch(error){
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         })
//     }
// } 

export {tryCatch}