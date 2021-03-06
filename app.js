Cards = new Meteor.Collection("cards");
Phones = new Meteor.Collection("phones");
Emails = new Meteor.Collection("emails");
Sites = new Meteor.Collection("sites");
Mouses = new Meteor.Collection("mouses");
Agenda = new Meteor.Collection("agenda");
Login = new Meteor.Collection("login");

function get(id){
  return (elem = document.getElementById(id)) && elem.value || "";
}
function now() {
  return new Date().getTime();
}
function randomColor(){
  return '#'+Math.floor(Math.random()*16777215).toString(16);
}
myCard = {};
if (Meteor.isClient) {
  Meteor.subscribe('cards');
  // Meteor.subscribe('mouses');
  Meteor.startup(function () {
     Session.set('user', Meteor.uuid());
      // Session.set("mouse", Mouses.insert({user: Session.get("user"), color: randomColor()}));
    if (!Session.get("myCard"))
      newCard();

  });
  Template.cards.cards = function () {
    return Cards.find({editing: null},{sort: {first_at: -1}});
    // $or: [{editing: null},{ _id: Session.get("myCard")}]
  };
  /*Template.mouses.mouses = function () {
    return Mouses.find();
  };*/
  Template.agenda.time_in_the_day = function(){
    var agenda = [];
    for (var hours = 7; hours < 23; hours++){
      for (var minutes = 0; minutes < 60; minutes += 30){
        time = {hours: hours < 10 ? "0"+hours : hours, minutes: minutes < 10 ? "0"+minutes : minutes};
        schedule = Agenda.findOne(time);
        if (!schedule){
           agenda.push(_.extend(time, {css_class: "free", description: "livre"}));
        } else agenda.push(schedule);
      }
    }
    return agenda;
  }
  newCard = function() {
      Session.set("myCard",
        Cards.insert({
          editing: true,
          first_at: now() + 1000000
      }));
  }
  Template.card.emails = function(){
    return Emails.find({card_id:this._id});
  };
  Template.card.phones = function(){
    return Phones.find({card_id:this._id});
  };
  Template.card.sites= function(){
    return Sites.find({card_id:this._id});
  };
  Template.yourcard.editing_card = function(){
    return Cards.findOne(Session.get("myCard"));
  }
  Template.yourcard.phones = function(){
    return Phones.find({card_id: Session.get("myCard")});
  }
  Template.yourcard.sites = function(){
    return Sites.find({card_id: Session.get("myCard")});
  }
  Template.yourcard.emails = function(){
    return Emails.find({card_id: Session.get("myCard")});
  }
  Template.card.logo_url =
  Template.yourcard.logo_url = function(){
   return this.logo+ "/convert?w=96&h=96";
  }
  Template.agenda.events({
    "click td": function (evt) {
      console.log("click :: ", evt, this);
      if (this.css_class == "free"){
        Agenda.insert({hours: this.hours, minutes: this.minutes, css_class: "busy", description: "ocupado" });
      } else {
        Agenda.remove(this._id);
      }
    }
  });
  Template.yourcard.events({
    "keyup input, change input" : function (evt) {
      value = get(evt.target.id);
      update = {};
      update[evt.target.id] = value;
      Cards.update(Session.get("myCard"), {$set: update});
    },
    'click input.add' : function (evt) {
      id = Session.get("myCard");
      console.log("publicando ", id);
      Cards.update(id,
        {$set: {
        services: get("services"),
        name: get("name"),
        editing: null
       }
      });
      if (Cards.findOne(id).first_at > now()) {
        Cards.update(id,
          {$set: {
            first_at: now(),
          }
         });
      }
      newCard();
    },
    'click input.add_other' : function (evt) {
      collection = eval($(evt.target).attr('add_to'));
      data = { card_id : Session.get("myCard") };
      console.log( 'SELECTOR',$(evt.target).parent().find("input:not([type=button]), select"));
      cancel = false;
      if (collection == Emails) {
        cancel = !$("#email")[0].value.match(/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i);
        if (cancel) {
          alert("E-mail inválido!");
        }
      }
      $(evt.target).parent().find("input:not([type=button]), select").each(function(i,element){
        if (element.value == null || element.value.length == 0)
          cancel = true;
        data[element.id ] = element.value;
        if (element.type == "text")
          element.value = "";
      });
      if (cancel) return;
      console.log(data);
      collection.insert( data);
    },
    'click a.delete': function(evt){
      from = $(evt.target).attr('from');
      id = from.toLowerCase().substring(0, from.length - 1);
      $("#"+id).val(eval("this."+id));
      collection = eval(from);
      collection.remove(this._id);
    }
  });
  Template.card.card_photo_url = function(){
   return this.card_photo + "/convert?w=360&h=200"
  };
  Template.card.events({
    'click input.remove' : function () {
      Cards.remove(this._id);
    },
    'click input.edit' : function () {
      id = Session.get("myCard");
      card = Cards.findOne(id);
      console.log("vai remover?", card.first_at, now());
      if (card.first_at > now()) {
        console.log("removendo",id);
        Cards.remove(id);
      } else {
        console.log("liberando",id);
        Cards.update(id,
          {$set: {
          editing: null
         }
        });
      }

      Session.set("myCard", this._id);
      Cards.update(this._id,
        {$set: {
        editing: true
       }
      });
    },
    'click input.first' : function () {
      Cards.update(this._id, {$set: {
        first_at: now()
      }});
    },
    'mouseover .layer': function(evt){
      console.log("mouseover ", evt);
      Mouses.update(Session.get("mouse"), {$set: {over_card: this._id, x: evt.clientX, y: evt.clientY}});
    },
    'mouseout .layer': function(){
      Mouses.update(Session.get("mouse"), {$set: {over_card: null}});
    },
    'click .layer': function(){
      flipToPhoto(this._id);
    }
  });
  arrangeCards = function() {
    setTimeout(function() {
      $('#cards').masonry('appended', $('#cards').children(":not(.masonry-brick)"));
      //$('#cards').masonry('reload');
    }, 100);
  }
  resize = function(elem) {
    child = elem.children(":not(.hide)");
    elem.height(child.height());
    arrangeCards();
  }
  Template.yourcard.rendered = function(){
    filepicker.setKey('AdNr2D8AQiacqq1EFAOxmz');
    filepicker.constructWidget(document.getElementById('logo'));
    filepicker.constructWidget(document.getElementById('card_photo'));
    elem = $(this.firstNode);
    resize(elem);
  }
  Template.cards.rendered = function() {
      $('#cards').masonry({
        itemSelector: '.card-wrapper',
        isAnimated: true
      });
      $('#cards').masonry('reload');
  }
  Template.card.rendered = function() {
    elem = $(this.firstNode);
    resize(elem);
  }

  Template.mousescount.mousesCount = function() {
    return Mouses.find({over_card: this._id}).count();
  };

  flipToPhoto = function (id) {
    toHide = $($('#card'+id).parent().children(":not(.hide)")[0]);
    console.log(toHide);
    toShow = toHide.next();
    if (toShow.length == 0) {
          toShow = $($('#card'+id).parent().children()[0]);
    }
    console.log(toShow);

    toHide.removeClass("animated");
    toShow.removeClass("animated");
    toShow.addClass("reverse");
    toHide.removeClass("reverse");

    toHide.addClass("animated");
    toHide.addClass("hide");
    toShow.removeClass("invisible");
    setTimeout(function() {
        if (toShow[0].id != toHide[0].id)
          toHide.addClass("invisible");
        toShow.addClass("animated");
        toShow.removeClass("hide");
    }, 300);
  }
}

if (Meteor.isServer) {
  Meteor.publish('cards', function () {
    return Cards.find();
  });
  Meteor.publish('mouses', function () {
    return Mouses.find();
  });
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
