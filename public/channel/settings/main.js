
$(document).ready(function(){
    $("input").on("blur", function() {
        if (
            $("input[name=countryA]").val() != "" ||
            $("input[name=nameA]").val() != "" ||
            $("input[name=paypalA]").val() != "" ||
            $("input[name=birthday]").val() != "" 
        ) {
            $(".invalid-feedback").show()
        } else {
            $(".invalid-feedback").hide()
        }
      })

      $("#applyBtn").click(function(){
          console.log( $("input[name=birthday]").val() == "" )
            if (
                $("input[name=countryA]").val() == "" ||
                $("input[name=nameA]").val() == "" ||
                $("input[name=paypalA]").val() == "" ||
                $("input[name=birthday]").val() == "" 
       
            ) {
                $(".invalid-feedback").show()
            } else {

               var country = $("input[name=countryA]").val()
               var name =  $("input[name=nameA]").val()
               var paypal =  $("input[name=paypalA]").val() 
               var birthday =  $("input[name=birthday]").val() 

                $.post({
                    url: "/CCFProgramSubmit",
                    data: {name: name, country: country, paypal: paypal,birthday: birthday},
                    success: function(data){
                        if(data.success === true){
                            $(".appStatus").css({"color": "#11C26D"}).html(data.msg)
                        } else {
                            $(".appStatus").html(data.msg).css({"color": "#FF4C52"})
                        }
                    }
                })
            }
      })
})