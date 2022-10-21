
    function addToCart(id){
        $.ajax({
        url:'/add-to-cart/'+id,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $("#cart-count").html(count)
            alert(response)
        }
}
})
    }
