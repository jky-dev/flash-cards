import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from 'src/app/services/crud.service';
import { Observer, Subscription } from 'rxjs';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, OnDestroy {
  observer: Observer<boolean>;
  sub: Subscription;
  ready: boolean;
  constructor(private crud: CrudService) {
    crud.initialize();
  }

  ngOnInit() {
    this.ready = this.crud.getIsReady();
    this.sub = this.crud.getIsReadyObserver().subscribe(x => {
      this.ready = x;
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
