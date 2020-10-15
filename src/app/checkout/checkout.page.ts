import { Component, OnInit } from "@angular/core";
import { ServerService } from "../service/server.service";
import {
  ToastController,
  Platform,
  LoadingController,
  NavController,
} from "@ionic/angular";
import {
  PayPal,
  PayPalPayment,
  PayPalConfiguration,
} from "@ionic-native/paypal/ngx";
import { Stripe } from "@ionic-native/stripe/ngx";
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder/ngx';
declare var google;

declare var RazorpayCheckout: any;

@Component({
  selector: "app-checkout",
  templateUrl: "./checkout.page.html",
  styleUrls: ["./checkout.page.scss"],
})
export class CheckoutPage implements OnInit {
  data: any;
  address: any;
  payment: any;
  payment_id: any;
  total_amount: any;
  paypal_id: any;
  text: any;
  stripe_id: any;
  stripeView = false;
  card_no: any;
  exp_month: any;
  exp_year: any;
  cvv: any;
  otype: number = 1;
  notes: any;

  paymentAmount: number = 333;
  currency: string = "INR";
  currencyIcon: string = "Rs.";
  razor_key = "";
  cardDetails: any = {};
  isEcash:boolean=false;
  ecash: any = 0;
  orderData: any;
  restaurant_data: any;
  addressCoords: any;
  extradeliveryCharge = 0
  constructor(
    public server: ServerService,
    public toastController: ToastController,
    public loadingController: LoadingController,
    private nav: NavController,
    private payPal: PayPal,
    private stripe: Stripe,
    public geolocation: Geolocation,
    public nativeGeocoder: NativeGeocoder
  ) {
    this.text = JSON.parse(localStorage.getItem("app_text"));
    this.restaurant_data = JSON.parse(localStorage.getItem("restaurant_data"))
  }

  ngOnInit() { }

  setEcash() {
    this.ecash=0
if(this.isEcash)
  this.ecash = (this.data.user.ecash >= this.total_payable())? this.total_payable():this.data.user.ecash
else
this.ecash =0

  }

  total_payable() {

    if (this.otype == 2 && this.data.d_charges > 0) {
      return this.total_amount - this.ecash - this.data.d_charges;
    } else {
      return this.total_amount - this.ecash + this.extradeliveryCharge;
    }
  }

  ionViewWillEnter() {
   
    this.server.getCoordinates(`${this.restaurant_data.store}, ${localStorage.getItem("city_name")}`).subscribe((response: any) => {
     
      this.restaurant_data.location = response.results[0].geometry.location
     
    })
   

    if (
      !localStorage.getItem("user_id") ||
      localStorage.getItem("user_id") == "null"
    ) {
      this.nav.navigateRoot("/login");

      this.presentToast("Please login for continue.");
    } else {
      this.loadData();
    }
  }

  async setAddress(a) {


      let perkm = this.restaurant_data.perkm? this.restaurant_data.perkm:0
      let deliverTo ={lat: a.lat, lng: a.lng}
      this.getDistance(this.restaurant_data.location, deliverTo).then((results:any) =>{
        let extradistance = ( results/ 1000) - 5
        console.log('extradistance',extradistance)     
        this.extradeliveryCharge = extradistance > 0 ? Math.floor(extradistance * perkm) : 0
        this.setEcash()
      })
      // .catch only runs when promise is rejected
      .catch(async (status)=> {
        const loading = await this.loadingController.create({
          message: "Something went wrong.",
          mode: "ios",
        });
        await loading.present();
      });
     
   
 
    this.address = a.id;
  }


  async getDistance(ori, dest) {

    let service = new google.maps.DistanceMatrixService;
    let origin = `${ori.lat},${ori.lng}`;
    let destination = `${dest.lat},${dest.lng}`;
    return new Promise(function(resolve, reject) {
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: 'DRIVING',
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, function (response, status) {
        if (status !== 'OK') {
         
          reject(status);
        } else {
          console.log(response.rows[0].elements[0].distance.value)
           resolve(response.rows[0].elements[0].distance.value);
        }
  
      });

    })
  }
 
  setType(id) {
    this.otype = id;
    this.setEcash()
  }

  formVal() {
    if (this.otype == 1) {
      if (!this.address || !this.payment) {
        return false;
      } else {
        return true;
      }
    } else {
      if (!this.payment) {
        return false;
      } else {
        return true;
      }
    }
  }

  async loadData() {
    const loading = await this.loadingController.create({
      message: "Please wait...",
      mode: "ios",
    });
    await loading.present();

    var lid = localStorage.getItem("lid") ? localStorage.getItem("lid") : 0;

    this.server
      .getAddress(
        localStorage.getItem("user_id") +
        "?cart_no=" +
        localStorage.getItem("cart_no") +
        "&lid=" +
        lid +
        "&lat=" +
        localStorage.getItem("current_lat") +
        "&lng=" +
        localStorage.getItem("current_lng")
      )
      .subscribe((response: any) => {
        this.data = response.data;
        this.total_amount = response.data.total;
        this.razor_key = response.data.r_id;
        //this.restaurant = response.data.address
        if (response.data.admin.paypal_client_id) {
          this.paypal_id = response.data.admin.paypal_client_id;
        }

        if (response.data.admin.stripe_client_id) {
          this.stripe_id = response.data.admin.stripe_client_id;
        }

        loading.dismiss();
      });
  }

  makeOrder() {
    if (this.payment == 2) {
      this.payWithRazor();
    } else if (this.payment == 3) {
      this.payPaypal();
    } else if (this.payment == 4) {
      this.payWithStripe();
    } else {
      this.order();
    }
  }

  setPayment(id) {
    this.payment = id;

    if (id == 4) {
      this.stripeView = true;
    } else {
      this.stripeView = false;
    }
  }

  async order() {
    const loading = await this.loadingController.create({
      message: "Please wait...",
      mode: "ios",
    });
    await loading.present();

    var addr = this.otype == 1 ? this.address : "NONE";

    var allData = {
      user_id: localStorage.getItem("user_id"),
      payment: this.payment,
      address: addr,
      cart_no: localStorage.getItem("cart_no"),
      payment_id: this.payment_id,
      total:this. total_payable() ,
      d_charges:Number(this.data.d_charges)+Number(this.extradeliveryCharge),
      otype: this.otype,
      notes: this.notes,
      ecash: this.ecash,
    };

    this.server.order(allData).subscribe((response: any) => {
      localStorage.setItem("order_data", JSON.stringify(response.data));

      this.nav.navigateRoot("/done");

      loading.dismiss();
    });
  }


  payWithRazor() {
    var options = {
      description: "Online Delivery",
      image: "https://i.imgur.com/79uXpfm.png",
      currency: this.currency,
      key: this.razor_key,
      amount: this. total_payable() * 100,
      name: "Door Bee",
      prefill: {
        email: this.data.user.email,
        contact: this.data.user.phone,
        name: this.data.user.name,
      },
      theme: {
        color: "#ffce00",
      },
      modal: {
        ondismiss: function () {
          alert("dismissed");
        },
      },
    };

    var successCallback = (success) => {
      this.payment_id = success;

      this.order();
    };

    var cancelCallback = function (error) {
      alert(error.description + " (Error " + error.code + ")");
    };

    RazorpayCheckout.open(options, successCallback, cancelCallback);
  }

  async presentToast(txt) {
    const toast = await this.toastController.create({
      message: txt,
      duration: 2000,
      position: "bottom",
    });
    toast.present();
  }

  payPaypal() {
    this.payPal
      .init({
        PayPalEnvironmentProduction: this.paypal_id,
        PayPalEnvironmentSandbox: this.paypal_id,
      })
      .then(
        () => {
          // Environments: PayPalEnvironmentNoNetwork, PayPalEnvironmentSandbox, PayPalEnvironmentProduction
          this.payPal
            .prepareToRender(
              "PayPalEnvironmentSandbox",
              new PayPalConfiguration({
                // Only needed if you get an "Internal Service Error" after PayPal login!
                //payPalShippingAddressOption: 2 // PayPalShippingAddressOptionPayPal
              })
            )
            .then(
              () => {
                let payment = new PayPalPayment(
                  this.total_amount,
                  "USD",
                  "Description",
                  "sale"
                );
                this.payPal.renderSinglePaymentUI(payment).then(
                  (res) => {
                    this.payment_id = res.response.id;

                    if (this.payment_id) {
                      this.order();
                    }
                  },
                  () => {
                    this.presentToast("Paypal Transaction Cancelled");
                  }
                );
              },
              () => {
                this.presentToast("Error in configuration");
              }
            );
        },
        () => {
          //

          this.presentToast(
            "Error in initialization, maybe PayPal isn't supported"
          );
        }
      );
  }

  payWithStripe() {
    if (
      this.card_no.length > 10 &&
      this.exp_month &&
      this.exp_year &&
      this.cvv
    ) {
      this.stripe.setPublishableKey(this.stripe_id);

      let card = {
        number: this.card_no,
        expMonth: this.exp_month,
        expYear: this.exp_year,
        cvc: this.cvv,
      };

      this.stripe
        .createCardToken(card)
        .then((token) => {
          console.log(token);
          this.makePayment(token.id);
        })
        .catch((error) => {
          this.presentToast("Please enter valid payment details");
        });
    } else {
      this.presentToast("Please enter valid payment details");
    }
  }

  async makePayment(token) {
    const loading = await this.loadingController.create({
      message: "Please wait...",
      mode: "ios",
    });
    await loading.present();

    this.server
      .makeStripePayment("?token=" + token + "&amount=" + this.total_amount)
      .subscribe((response: any) => {
        if (response.data == "done") {
          this.payment_id = response.id;

          if (this.payment_id) {
            this.order();
          }
        } else {
          this.presentToast("Something went wrong.Please try again.");
        }

        loading.dismiss();
      });
  }
}
