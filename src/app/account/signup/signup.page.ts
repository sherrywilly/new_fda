import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../service/server.service';
import { ToastController,NavController,Platform,LoadingController,Events } from '@ionic/angular';
import { SmsRetriever } from '@ionic-native/sms-retriever/ngx';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})

export class SignupPage implements OnInit {
  
  text:any;
  user_id:any;
  phone:any;
  otp:any;
  constructor(private smsRetriever: SmsRetriever,private route: ActivatedRoute,public server : ServerService,public toastController: ToastController,private nav: NavController,public loadingController: LoadingController,public events: Events){

   this.text = JSON.parse(localStorage.getItem('app_text'));

  }

  ngOnInit()
  {
  }

  async signup(data)
  {
    if(data.phone.length != "10")
    {
      this.presentToast("Please enter a valid phone number.");
    }
    else
    {
      const loading = await this.loadingController.create({
      message: 'Please wait...',
    });
    await loading.present();

    this.server.signup(data).subscribe((response:any) => {
  
    if(response.msg == "error")
    {
      this.presentToast(response.error);
    }
    else
    {
      this.user_id = response.user_id;

      this.presentToast("Please verify your phone number.");

      this.phone = data.phone;
    }

    loading.dismiss();

    });
    }
  }

  async verify(data)
  {
    if(data.otp.length == 0)
    {
      this.presentToast('Please enter your OTP');
    }
    else
    {
      const loading = await this.loadingController.create({
      message: 'Please wait...',
      duration: 3000,
      mode:'ios'
      });
      await loading.present();

      var allData = {otp : data.otp,user_id : this.user_id}

      this.server.verify(allData).subscribe((response:any) => {

      if(response.msg == "error")
      {
        this.presentToast(response.error);
      }
      else
      {
        this.user_id     = response.user_id;

        localStorage.setItem('user_id',response.user_id);
      
        this.presentToast("Account Created Successfully.Please Continue");

        if(localStorage.getItem('cart_no'))
        {
          this.nav.navigateBack('/cart'); 
        }
        else
        {
          this.nav.navigateRoot('profile'); 
        }

      }

      loading.dismiss();

      });
    }
  }

  async presentToast(txt) {
    const toast = await this.toastController.create({
      message: txt,
      duration: 3000,
      position : 'top',
      mode:'ios',
      color:'dark'
    });
    toast.present();
  }

  
  async resend()
  {
    const loading = await this.loadingController.create({
    message: 'Please wait...',
    mode:'ios'
    });
    await loading.present();

    this.server.forgot({phone:this.phone}).subscribe((response:any) => {

    if(response.msg == "error")
    {
      this.presentToast(response.error);
    }
    else
    {
      this.presentToast("OTP sent successfully");
      this.user_id = response.user_id;
    }

    loading.dismiss();

    });
  }

}
