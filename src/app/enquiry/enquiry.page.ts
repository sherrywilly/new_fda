import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../service/server.service';
import { ToastController,NavController,Platform,LoadingController,Events } from '@ionic/angular';

@Component({
  selector: 'app-enquiry',
  templateUrl: './enquiry.page.html',
  styleUrls: ['./enquiry.page.scss'],
})

export class EnquiryPage implements OnInit {
  
  text:any;
  
  constructor(private route: ActivatedRoute,public server : ServerService,public toastController: ToastController,private nav: NavController,public loadingController: LoadingController,public events: Events){

  this.text = JSON.parse(localStorage.getItem('app_text'));

  }

  ngOnInit()
  {
  
  }

  async login(data)
  {
    const loading = await this.loadingController.create({
      message: 'Please wait...',
    });
    await loading.present();

    this.server.enquiry(data).subscribe((response:any) => {
 
    this.presentToast("Thank You! We have received your request. We will contact you soon.");

    this.nav.navigateRoot('home');  

    loading.dismiss();

    });
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

  goBck()
  {
      if(localStorage.getItem('cart_no'))
      {
        this.nav.navigateBack('cart');  
      }
      else
      {
        this.nav.navigateRoot('home');  
      }
  }
}
